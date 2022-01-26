/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { combineReaderEithers } from "@root/utils/combineReaderEithers";
import { sequenceReaderEither } from "@root/utils/sequenceReaderEither";
import { left, map, mapLeft, right } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import {
    ReaderEither,
    map as mapReader,
    mapLeft as mapLeftReader,
    right as rightReader,
} from "fp-ts/lib/ReaderEither";

import {
    ArrayType,
    FunctionType,
    ObjectType,
    ParsedType,
    PrimitiveType,
    RefableType,
    ReferenceType,
    UnionType,
    UserType,
} from "../model";
import { isNumberUnion, isStringUnion } from "../utils/guards/isSpecificUnion";
import { GeneratorConfig } from "./generator.config";
import {
    CannotGenerateEmptyUnionTypeError,
    CannotGenerateFunctionArgumentError,
    CannotGenerateFunctionArgumentsError,
    CannotGenerateFunctionReturnTypeError,
    CannotGenerateTypeError,
    CannotGenerateUnionError,
    CannotStringifyVoidError,
    ReferenceTypeGenericError,
} from "./generator.errors";

export type TypeToStringResult = { result: string; imports: string[] };

export type TypeToStringError =
    | ReferenceTypeGenericError
    | CannotStringifyVoidError
    | CannotGenerateFunctionArgumentsError<TypeToStringError>
    | CannotGenerateFunctionReturnTypeError<TypeToStringError>
    | CannotGenerateEmptyUnionTypeError
    | CannotGenerateUnionError
    | CannotGenerateTypeError;

export const typeToString = (
    type: ParsedType,
    getReferenceTo: (obj: RefableType) => { name: string }
): ReaderEither<GeneratorConfig, TypeToStringError, TypeToStringResult> => (
    config
) => {
    if (type instanceof PrimitiveType) {
        if (type.type === "VOID") {
            return left(new CannotStringifyVoidError());
        }
        if (config.primitiveMapping && config.primitiveMapping[type.type]) {
            return right(config.primitiveMapping[type.type]);
        }
        return right({
            result:
                type.type === "BOOLEAN"
                    ? "boolean"
                    : type.type === "NUMBER"
                    ? "double"
                    : "String",
            imports: [],
        });
    }
    if (type instanceof FunctionType) {
        return pipe(
            config,
            combineReaderEithers(
                type.type.identifier === "primitive" &&
                    type.type.type === "VOID"
                    ? rightReader({
                          result: "void",
                          imports: new Array<string>(),
                      })
                    : typeToString(type.type, getReferenceTo),
                sequenceReaderEither(
                    type.parameters.map((parameter) =>
                        pipe(
                            typeToString(parameter.type, getReferenceTo),
                            mapReader((type) => ({
                                type,
                                name: parameter.name,
                            })),
                            mapLeftReader(
                                (err) =>
                                    new CannotGenerateFunctionArgumentError(
                                        parameter.name,
                                        err
                                    )
                            )
                        )
                    )
                ),
                (returnType, params) => {
                    const imports = new Set(returnType.imports);

                    const stringParameters = params.map((param) => {
                        param.type.imports.forEach((item) => imports.add(item));
                        return {
                            name: param.name,
                            type: param.type.result,
                        };
                    });

                    const func = config.generateFunctionType(
                        stringParameters,
                        returnType.result
                    );

                    func.imports.forEach((item) => imports.add(item));

                    return {
                        result: func.result,
                        imports: Array.from(imports),
                    };
                }
            ),
            mapLeft((error) => {
                if (error instanceof Array)
                    return new CannotGenerateFunctionArgumentsError(error);
                return new CannotGenerateFunctionReturnTypeError(error);
            })
        );
    }

    if (type instanceof ObjectType) {
        const ref = getReferenceTo(type);
        return right({
            result: ref.name,
            imports: [],
        });
    }

    if (type instanceof ArrayType) {
        return pipe(
            config,
            typeToString(type.type, getReferenceTo),
            map((type) => {
                const imports = new Set(type.imports);

                const array = config.generateArrayType(type.result);

                array.imports.forEach((item) => imports.add(item));

                return {
                    result: array.result,
                    imports: Array.from(imports),
                };
            })
        );
    }

    if (type instanceof UnionType) {
        const types = type.type.filter(
            (item) => !(item.identifier === "primitive" && item.type === "VOID")
        );

        if (types.length === 0) {
            return left(new CannotGenerateEmptyUnionTypeError());
        }

        if (types.length === 1) {
            return typeToString(types[0], getReferenceTo)(config);
        }

        const pureUnion = new UnionType(types);

        if (isStringUnion(pureUnion) || isNumberUnion(pureUnion)) {
            const ref = getReferenceTo(pureUnion);

            return right({
                imports: [],
                result: ref.name,
            });
        }

        return left(new CannotGenerateUnionError());
    }

    if (type instanceof ReferenceType) {
        const ref = config.nativeReferencesMap[type.type.typeName];

        if (!ref)
            return left(
                new Error(`Unknown native reference to "${type.type.typeName}"`)
            );

        const generics = pipe(
            config,
            sequenceReaderEither(
                type.type.genericArgs.map((t) =>
                    typeToString(t, getReferenceTo)
                )
            ),
            map((results) => {
                const args: string[] = [];
                const genericImports = new Set([ref.import]);
                for (const tts of results) {
                    args.push(tts.result);
                    for (const imprt of tts.imports) {
                        genericImports.add(imprt);
                    }
                }
                return {
                    imports: Array.from(genericImports),
                    result:
                        ref.text +
                        (args.length === 0 ? "" : `<${args.join(", ")}>`),
                };
            }),
            mapLeft((errors) => {
                return new ReferenceTypeGenericError(
                    type.type.typeName,
                    errors,
                    type
                );
            })
        );

        return generics;
    }
    if (type instanceof UserType) {
        return right({
            imports: type.type.imports,
            result: type.type.text,
        });
    }

    return left(new CannotGenerateTypeError(type));
};
