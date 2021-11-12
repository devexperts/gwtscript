/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either, left, map, mapLeft, right } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
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
import { sequenceEither } from "../utils/sequenceEither";
import { unEither } from "../utils/unEither";
import { GeneratorConfig } from "./generator.config";
import { ReferenceTypeGenericError } from "./generator.errors";

export type TypeToStringResult = { result: string; imports: string[] };

export const typeToString = (
    type: ParsedType,
    config: GeneratorConfig,
    getReferenceTo: (obj: RefableType) => { name: string }
): Either<Error | ReferenceTypeGenericError, TypeToStringResult> => {
    if (type instanceof PrimitiveType) {
        if (type.type === "VOID") {
            return left(
                new Error("Cannot stringify VOID when it's not a function type")
            );
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
        return unEither(
            typeToString,
            {
                imports: [],
                result: "Error",
            },
            (unEither) => {
                return config.generateFunctionType(type, (f) => {
                    return unEither(f, config, getReferenceTo);
                });
            }
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
        return unEither(
            typeToString,
            {
                imports: [],
                result: "Error",
            },
            (unEithered) =>
                config.generateArrayType(type, (f) =>
                    unEithered(f, config, getReferenceTo)
                )
        );
    }

    if (type instanceof UnionType) {
        const types = type.type.filter(
            (item) => !(item.identifier === "primitive" && item.type === "VOID")
        );

        if (types.length === 0) {
            return left(new Error("Empty union type"));
        }

        if (types.length === 1) {
            return typeToString(types[0], config, getReferenceTo);
        }

        const pureUnion = new UnionType(types);

        if (isStringUnion(pureUnion) || isNumberUnion(pureUnion)) {
            const ref = getReferenceTo(pureUnion);

            return right({
                imports: [],
                result: ref.name,
            });
        }

        return left(
            new Error(
                `Cannot stringify union, ${JSON.stringify(type, undefined, 2)}`
            )
        );
    }

    if (type instanceof ReferenceType) {
        const ref = config.nativeReferencesMap[type.type.typeName];

        if (!ref)
            return left(
                new Error(`Unknown native reference to "${type.type.typeName}"`)
            );

        const generics = pipe(
            sequenceEither(
                type.type.genericArgs.map((t) =>
                    typeToString(t, config, getReferenceTo)
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

    return left(new Error(`Unkown type: ${JSON.stringify(type, null, 2)}`));
};
