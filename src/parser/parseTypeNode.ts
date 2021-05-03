import * as ts from "typescript";
import {
    ArrayType,
    FunctionType,
    ObjectType,
    ParsedType,
    PrimitiveType,
    ReferenceType,
    UnionType,
} from "../model";

import { Option, some, none, sequenceArray, map, filter } from "fp-ts/Option";
import { combineOptions } from "../utils/combineOptions";
import { getParsedType } from "./getParsedType";
import { ParserConfig } from "./parser.model";
import { pipe } from "fp-ts/lib/function";
import { flatten } from "fp-ts/lib/ReadonlyArray";

export const parseTypeNode = (
    node: ts.TypeNode | ts.TypeElement,
    checker: ts.TypeChecker,
    type: ts.Type,
    config: ParserConfig
): Option<ParsedType> => {
    // Primitive detection
    switch (node.kind) {
        case ts.SyntaxKind.NumberKeyword:
            return some(new PrimitiveType("NUMBER"));
        case ts.SyntaxKind.StringKeyword:
            return some(new PrimitiveType("STRING"));
        case ts.SyntaxKind.NullKeyword:
        case ts.SyntaxKind.UndefinedKeyword:
        case ts.SyntaxKind.VoidKeyword:
            return some(new PrimitiveType("VOID"));
        case ts.SyntaxKind.BooleanKeyword:
            return some(new PrimitiveType("BOOLEAN"));
        case ts.SyntaxKind.AnyKeyword:
            return some(new PrimitiveType("ANY"));
    }

    // Function type detection
    if (ts.isFunctionTypeNode(node)) {
        const declaration = type.symbol?.declarations[0];
        const func =
            declaration && ts.isMethodSignature(declaration)
                ? declaration
                : node;
        return combineOptions(
            parseTypeNode(
                func.type,
                checker,
                checker.getTypeAtLocation(func.type),
                config
            ),
            sequenceArray(
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
        );
    }

    // Type reference handling
    if (ts.isTypeReferenceNode(node)) {
        const identifier = ts.isIdentifier(node.typeName)
            ? node.typeName.escapedText.toString()
            : null;
        if (identifier && config.nativeReferences.includes(identifier)) {
            return pipe(
                sequenceArray(
                    node.typeArguments?.map((item) => {
                        return parseTypeNode(
                            item,
                            checker,
                            checker.getTypeFromTypeNode(item),
                            config
                        );
                    }) ?? []
                ),
                map(
                    (args) =>
                        new ReferenceType({
                            typeName: identifier,
                            genericArgs: args,
                        })
                )
            );
        }
        // if reference type is a shape
        if (type.symbol) {
            return pipe(
                sequenceArray(
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
                            return combineOptions(
                                parseTypeNode(
                                    first.type,
                                    checker,
                                    checker.getTypeAtLocation(first.type),
                                    config
                                ),
                                sequenceArray(
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
                            );
                        }
                        return none;
                    })
                ),
                map(
                    (fields) =>
                        new ObjectType(
                            fields,
                            type.isClassOrInterface()
                                ? node.typeName.getText()
                                : undefined
                        )
                )
            );
        }

        return getParsedType(type);
    }

    if (ts.isTypeLiteralNode(node)) {
        return pipe(
            sequenceArray(
                node.members.map((type) => {
                    if (ts.isPropertySignature(type)) {
                        return pipe(
                            parseTypeNode(
                                type.type,
                                checker,
                                checker.getTypeFromTypeNode(type.type),
                                config
                            ),
                            map((value) => ({
                                name: type.name.getText(),
                                type: value,
                            }))
                        );
                    }
                    return none;
                })
            ),
            map(
                (fields: readonly { type: ParsedType; name: string }[]) =>
                    new ObjectType(fields)
            )
        );
    }

    if (ts.isArrayTypeNode(node)) {
        return pipe(
            parseTypeNode(
                node.elementType,
                checker,
                checker.getTypeFromTypeNode(node.elementType),
                config
            ),
            map((value) => new ArrayType(value))
        );
    }

    if (ts.isUnionTypeNode(node) && type.isUnion()) {
        return pipe(
            sequenceArray(
                node.types.map((typePart, i) =>
                    parseTypeNode(typePart, checker, type.types[i], config)
                )
            ),
            map((types) => new UnionType(types))
        );
    }

    if (ts.isParenthesizedTypeNode(node)) {
        return parseTypeNode(
            node.type,
            checker,
            checker.getTypeFromTypeNode(node.type),
            config
        );
    }

    if (ts.isIntersectionTypeNode(node) && type.isIntersection()) {
        return pipe(
            sequenceArray(
                node.types.map((item, i) => {
                    return pipe(
                        parseTypeNode(item, checker, type.types[i], config),
                        filter(
                            (type): type is ObjectType =>
                                type instanceof ObjectType
                        )
                    );
                })
            ),
            map(
                (objects) =>
                    new ObjectType(flatten(objects.map((item) => item.type)))
            )
        );
    }

    return none;
};
