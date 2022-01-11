/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
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

import { combineReaderEithers } from "@root/utils/combineReaderEithers";
import { sequenceReaderEither } from "@root/utils/sequenceReaderEither";
import { combineEithers } from "@root/utils/combineEithers";
import { sequenceEither } from "@root/utils/sequenceEither";

import { getParsedType } from "./getParsedType";
import { ParserConfig } from "./parser.model";
import { getEscapedText } from "../utils/getEscapedText";
import {
    CannotParseTypeNodeError,
    FailedToParseFunctionParametersError,
    FailedToParseFunctionReturnTypeError,
    FailedToParseGenericParametersForNativeReferenceTypeError,
    FailedToParseIntersectionError,
    FailedToParseObjectError,
    FailedToParsePrimitiveReferenceTypeError,
    FailedToParseReferenceToTypeError,
    FailedToParseUnionError,
    UnknownSignatureError,
} from "./parser.errors";
import { flatten } from "fp-ts/lib/ReadonlyArray";

export type ParseTypeNode = {
    typeName: string;
    fieldName: string;
    location: string;
};

export type ParseTypeNodeError =
    | UnknownSignatureError
    | CannotParseTypeNodeError
    | FailedToParseFunctionReturnTypeError
    | FailedToParseFunctionParametersError
    | FailedToParseGenericParametersForNativeReferenceTypeError
    | FailedToParsePrimitiveReferenceTypeError
    | FailedToParseReferenceToTypeError
    | FailedToParseObjectError
    | FailedToParseUnionError
    | FailedToParseIntersectionError;

export const parseTypeNode = (
    node: ts.TypeNode | ts.TypeElement,
    checker: ts.TypeChecker,
    type: ts.Type,
    config: ParserConfig
): ReaderEither<ParseTypeNode, ParseTypeNodeError, ParsedType> => (env) => {
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
        const declaration = type.symbol?.declarations[0];
        const func =
            declaration && ts.isMethodSignature(declaration)
                ? declaration
                : node;
        return pipe(
            env,
            combineReaderEithers(
                parseTypeNode(
                    func.type,
                    checker,
                    checker.getTypeAtLocation(func.type),
                    config
                ),
                sequenceReaderEither(
                    func.parameters.map((param) => {
                        return parseTypeNode(
                            param.type,
                            checker,
                            checker.getTypeAtLocation(param.type),
                            config
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
                env,
                sequenceReaderEither(
                    node.typeArguments?.map((item) => {
                        return parseTypeNode(
                            item,
                            checker,
                            checker.getTypeFromTypeNode(item),
                            config
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
        // if reference type is a shape
        if (type.symbol) {
            return pipe(
                env,
                sequenceReaderEither(
                    type.getProperties().map((symbol) => {
                        const first = symbol.declarations[0];
                        if (ts.isPropertySignature(first)) {
                            return pipe(
                                parseTypeNode(
                                    first.type,
                                    checker,
                                    checker.getTypeFromTypeNode(first.type),
                                    config
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
                                        config
                                    ),
                                    sequenceReaderEither(
                                        first.parameters.map((param) => {
                                            return parseTypeNode(
                                                param.type,
                                                checker,
                                                checker.getTypeAtLocation(
                                                    param.type
                                                ),
                                                config
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
                                env.location
                            )
                        );
                    })
                ),
                mapEither(
                    (fields) =>
                        new ObjectType(
                            fields,
                            type.isClassOrInterface()
                                ? node.typeName.getText()
                                : undefined
                        )
                ),
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

    // Object fields
    if (ts.isTypeLiteralNode(node)) {
        return pipe(
            sequenceEither(
                node.members.map((type) => {
                    if (ts.isPropertySignature(type)) {
                        return combineEithers(
                            parseTypeNode(
                                type.type,
                                checker,
                                checker.getTypeAtLocation(type.type),
                                config
                            )(env),
                            // TODO fix node - parent relationship
                            getEscapedText(type.name),
                            (type, name) => ({
                                name,
                                type,
                            })
                        );
                    }
                    return left(
                        new UnknownSignatureError(
                            env.typeName,
                            env.fieldName,
                            env.location
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
            env,
            parseTypeNode(
                node.elementType,
                checker,
                checker.getTypeFromTypeNode(node.elementType),
                config
            ),
            mapEither((value) => new ArrayType(value))
        );
    }

    if (ts.isUnionTypeNode(node) && type.isUnion()) {
        return pipe(
            env,
            sequenceReaderEither(
                node.types.map((typePart, i) =>
                    parseTypeNode(typePart, checker, type.types[i], config)
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
            env,
            parseTypeNode(
                node.type,
                checker,
                checker.getTypeFromTypeNode(node.type),
                config
            )
        );
    }

    if (ts.isIntersectionTypeNode(node) && type.isIntersection()) {
        return pipe(
            env,
            sequenceReaderEither(
                node.types.map((item, i) => {
                    return pipe(
                        parseTypeNode(item, checker, type.types[i], config)
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
            node
        )
    );
};
