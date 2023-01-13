/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { pipe } from "fp-ts/lib/function";
import {
    right,
    left,
    map as mapEither,
    mapLeft as mapLeftEither,
} from "fp-ts/lib/Either";
import {
    ReaderEither,
    mapLeft,
    map,
    left as readerLeft,
} from "fp-ts/lib/ReaderEither";
import { flatten } from "fp-ts/lib/ReadonlyArray";

import { combineReaderEithers } from "@root/utils/fp-ts/combineReaderEithers";
import { sequenceReaderEither } from "@root/utils/fp-ts/sequenceReaderEither";
import { sequenceEither } from "@root/utils/fp-ts/sequenceEither";

import { getParsedType, GetParsedTypeError } from "./getParsedType";
import { ParserConfig } from "./parser.model";
import {
    CannotParseTypeNodeError,
    FailedToGetEscapedName,
    FailedToParseFunctionParameterError,
    FailedToParseFunctionParametersError,
    FailedToParseFunctionReturnTypeError,
    FailedToParseGenericParametersForNativeReferenceTypeError,
    FailedToParseIntersectionError,
    FailedToParseObjectError,
    FailedToParseObjectFieldError,
    FailedToParsePrimitiveReferenceTypeError,
    FailedToParseReferenceToTypeError,
    FailedToParseUnionError,
    UnknownSignatureError,
} from "./parser.errors";
import {
    ArrayType,
    FunctionType,
    NumberLiteral,
    ObjectType,
    ParsedType,
    PrimitiveType,
    ReferenceType,
    StringLiteral,
    UnionType,
} from "../model";

export type ParseTypeNode = {
    typeName: string;
    fieldName: string;
    location: string;
};

export type ParseTypeNodeError =
    | UnknownSignatureError
    | CannotParseTypeNodeError
    | FailedToParseFunctionReturnTypeError<ParseTypeNodeError>
    | FailedToParseFunctionParametersError<ParseTypeNodeError>
    | FailedToParseGenericParametersForNativeReferenceTypeError<ParseTypeNodeError>
    | FailedToParsePrimitiveReferenceTypeError<GetParsedTypeError>
    | FailedToParseReferenceToTypeError<ParseTypeNodeError>
    | FailedToParseObjectError<ParseTypeNodeError>
    | FailedToParseUnionError<ParseTypeNodeError>
    | FailedToParseIntersectionError<ParseTypeNodeError>
    | FailedToGetEscapedName;

export const parseTypeNode = (
    node: ts.TypeNode | ts.TypeElement,
    checker: ts.TypeChecker,
    type: ts.Type,
    env: ParseTypeNode
): ReaderEither<ParserConfig, ParseTypeNodeError, ParsedType> => (config) => {
    // Primitive detection
    switch (node.kind) {
        case ts.SyntaxKind.NumberKeyword:
            return right(new PrimitiveType("NUMBER"));
        case ts.SyntaxKind.StringKeyword:
            return right(new PrimitiveType("STRING"));
        case ts.SyntaxKind.NullKeyword:
        case ts.SyntaxKind.UndefinedKeyword:
        case ts.SyntaxKind.VoidKeyword:
            return right(new PrimitiveType("VOID"));
        case ts.SyntaxKind.BooleanKeyword:
            return right(new PrimitiveType("BOOLEAN"));
        case ts.SyntaxKind.AnyKeyword:
            return right(new PrimitiveType("ANY"));
    }

    // checking for literals
    if (ts.isLiteralTypeNode(node)) {
        if (node.literal.kind === ts.SyntaxKind.StringLiteral) {
            return right(new StringLiteral(node.literal.text));
        }
        if (node.literal.kind === ts.SyntaxKind.NumericLiteral) {
            return right(new NumberLiteral(Number(node.literal.text)));
        }
        if (node.literal.kind === ts.SyntaxKind.NullKeyword) {
            return right(new PrimitiveType("VOID"));
        }
    }

    // Function type detection
    if (ts.isFunctionTypeNode(node)) {
        const signature = type.getCallSignatures()[0];
        const declaration = type.symbol?.declarations[0];

        const func =
            declaration && ts.isMethodSignature(declaration)
                ? declaration
                : node;

        return pipe(
            config,
            combineReaderEithers(
                parseTypeNode(
                    func.type,
                    checker,
                    signature.getReturnType(),
                    env
                ),
                sequenceReaderEither(
                    func.parameters.map((param, i) => {
                        const parameterSymbol = signature.parameters[i];
                        return pipe(
                            parseTypeNode(
                                param.type,
                                checker,
                                checker.getTypeAtLocation(
                                    parameterSymbol.valueDeclaration
                                ),
                                env
                            ),
                            map((type) => ({
                                type,
                                name: parameterSymbol.name,
                            })),
                            mapLeft((error) => {
                                return new FailedToParseFunctionParameterError(
                                    env.typeName,
                                    env.fieldName,
                                    env.location,
                                    parameterSymbol.name,
                                    error
                                );
                            })
                        );
                    })
                ),
                (returnType, fields) => {
                    return new FunctionType(returnType, fields);
                }
            ),
            mapLeftEither((err) => {
                if (err instanceof Array) {
                    return new FailedToParseFunctionParametersError(
                        env.typeName,
                        env.fieldName,
                        env.location,
                        err
                    );
                }
                return new FailedToParseFunctionReturnTypeError(
                    env.typeName,
                    env.fieldName,
                    env.location,
                    err
                );
            })
        );
    }

    // Type reference handling
    if (ts.isTypeReferenceNode(node)) {
        const identifier = ts.isIdentifier(node.typeName)
            ? node.typeName.escapedText.toString()
            : null;
        if (identifier && config.nativeReferences.includes(identifier)) {
            return pipe(
                config,
                sequenceReaderEither(
                    node.typeArguments?.map((item) => {
                        return parseTypeNode(
                            item,
                            checker,
                            checker.getTypeFromTypeNode(item),
                            env
                        );
                    }) ?? []
                ),
                mapEither(
                    (args) =>
                        new ReferenceType({
                            typeName: identifier,
                            genericArgs: args,
                        })
                ),
                mapLeftEither(
                    (e) =>
                        new FailedToParseGenericParametersForNativeReferenceTypeError(
                            env.typeName,
                            env.fieldName,
                            env.location,
                            e
                        )
                )
            );
        }

        // if reference type is a shape and an interface
        if (type.symbol) {
            return pipe(
                config,
                sequenceReaderEither(
                    type.getProperties().map((symbol) => {
                        const first = symbol.declarations[0];
                        if (ts.isPropertySignature(first)) {
                            return pipe(
                                parseTypeNode(
                                    first.type,
                                    checker,
                                    checker.getTypeAtLocation(first.type),
                                    env
                                ),
                                map((parsed) => ({
                                    name: symbol.name,
                                    type: parsed,
                                }))
                            );
                        }
                        if (ts.isMethodSignature(first)) {
                            return pipe(
                                combineReaderEithers(
                                    parseTypeNode(
                                        first.type,
                                        checker,
                                        checker.getTypeAtLocation(first.type),
                                        env
                                    ),
                                    sequenceReaderEither(
                                        first.parameters.map((param) => {
                                            return pipe(
                                                parseTypeNode(
                                                    param.type,
                                                    checker,
                                                    checker.getTypeAtLocation(
                                                        param.type
                                                    ),
                                                    env
                                                ),
                                                map((type) => ({
                                                    type,
                                                    name: symbol.name,
                                                })),
                                                mapLeft((error) => {
                                                    return new FailedToParseFunctionParameterError(
                                                        env.typeName,
                                                        env.fieldName,
                                                        env.location,
                                                        symbol.name,
                                                        error
                                                    );
                                                })
                                            );
                                        })
                                    ),
                                    (returnType, fields) => {
                                        return {
                                            name: symbol.name,
                                            type: new FunctionType(
                                                returnType,
                                                fields
                                            ),
                                        };
                                    }
                                ),
                                mapLeft((err) => {
                                    if (err instanceof Array) {
                                        return new FailedToParseFunctionParametersError(
                                            env.typeName,
                                            env.fieldName,
                                            env.location,
                                            err
                                        );
                                    }
                                    return new FailedToParseFunctionReturnTypeError(
                                        env.typeName,
                                        env.fieldName,
                                        env.location,
                                        err
                                    );
                                })
                            );
                        }
                        return readerLeft(
                            new UnknownSignatureError(
                                env.typeName,
                                env.fieldName,
                                env.location,
                                symbol.name
                            )
                        );
                    })
                ),
                mapEither((fields) => new ObjectType(fields)),
                mapLeftEither(
                    (e) =>
                        new FailedToParseReferenceToTypeError(
                            env.typeName,
                            env.fieldName,
                            env.location,
                            e
                        )
                )
            );
        }

        // Unfortunately, in non-shape cases we only have ts.Type.
        return pipe(
            env,
            getParsedType(type),
            mapLeftEither(
                (e) =>
                    new FailedToParsePrimitiveReferenceTypeError(
                        env.typeName,
                        env.fieldName,
                        env.location,
                        e
                    )
            )
        );
    }

    // Object type
    if (ts.isTypeLiteralNode(node)) {
        return pipe(
            sequenceEither(
                type.getProperties().map((symbol) => {
                    const type = symbol.valueDeclaration;

                    if (ts.isPropertySignature(type)) {
                        return pipe(
                            config,
                            parseTypeNode(
                                type.type,
                                checker,
                                checker.getTypeAtLocation(type.type),
                                env
                            ),
                            mapEither((type) => ({
                                type,
                                name: symbol.name,
                            })),
                            mapLeftEither(
                                (e) =>
                                    new FailedToParseObjectFieldError(
                                        env.typeName,
                                        env.fieldName,
                                        env.location,
                                        symbol.name,
                                        e
                                    )
                            )
                        );
                    }
                    return left(
                        new FailedToParseObjectFieldError(
                            env.typeName,
                            env.fieldName,
                            env.location,
                            symbol.name,
                            new UnknownSignatureError(
                                env.typeName,
                                env.fieldName,
                                env.location,
                                symbol.name
                            )
                        )
                    );
                })
            ),
            mapEither(
                (fields: readonly { type: ParsedType; name: string }[]) =>
                    new ObjectType(fields)
            ),
            mapLeftEither((e) => {
                return new FailedToParseObjectError(
                    env.typeName,
                    env.fieldName,
                    env.location,
                    e
                );
            })
        );
    }

    if (ts.isArrayTypeNode(node)) {
        return pipe(
            config,
            parseTypeNode(
                node.elementType,
                checker,
                checker.getTypeFromTypeNode(node.elementType),
                env
            ),
            mapEither((value) => new ArrayType(value))
        );
    }

    if (ts.isUnionTypeNode(node)) {
        return pipe(
            config,
            sequenceReaderEither(
                node.types.map((typePart) =>
                    parseTypeNode(
                        typePart,
                        checker,
                        checker.getTypeAtLocation(typePart),
                        env
                    )
                )
            ),
            mapEither((types) => new UnionType(types)),
            mapLeftEither(
                (e) =>
                    new FailedToParseUnionError(
                        env.typeName,
                        env.fieldName,
                        env.location,
                        e
                    )
            )
        );
    }

    if (ts.isParenthesizedTypeNode(node)) {
        return pipe(
            config,
            parseTypeNode(
                node.type,
                checker,
                checker.getTypeFromTypeNode(node.type),
                env
            )
        );
    }

    if (ts.isIntersectionTypeNode(node) && type.isIntersection()) {
        return pipe(
            config,
            sequenceReaderEither(
                node.types.map((item, i) => {
                    return pipe(
                        parseTypeNode(item, checker, type.types[i], env)
                    );
                })
            ),
            mapEither((value) =>
                value.filter(
                    (type): type is ObjectType => type instanceof ObjectType
                )
            ),
            mapEither(
                (objects) =>
                    new ObjectType(flatten(objects.map((item) => item.type)))
            ),
            mapLeftEither(
                (err) =>
                    new FailedToParseIntersectionError(
                        env.typeName,
                        env.fieldName,
                        env.location,
                        err
                    )
            )
        );
    }

    return left(
        new CannotParseTypeNodeError(
            env.typeName,
            env.fieldName,
            env.location,
            config.disableTypesInErrors ? (null as any) : node
        )
    );
};
