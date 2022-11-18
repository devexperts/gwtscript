/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { isRight, left, map, mapLeft, right } from "fp-ts/lib/Either";
import { ReaderEither } from "fp-ts/lib/ReaderEither";
import { getOrElse, isSome } from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";

import {
    parseToJavaString,
    ToJavaSyntaxError,
} from "@root/utils/parseToJavaString";
import { ParsingError } from "@root/utils/parseInJavaString";
import { getComments } from "@root/utils/getComments";

import { ParserConfig } from "./parser.model";
import { UserType } from "../model";
import {
    EmptyShapeException,
    FailedToUnifyTypeOfInterface,
    UnexpectedDeclarationTypeError,
} from "./parser.errors";
import { getInJavaDeclaration } from "./utils/getInJavaDeclaration";

export interface SimplifiedInterface {
    name: string;
    fields: Array<{
        name: string;
        node: ts.TypeNode;
        type: ts.Type;
        userInput?: UserType;
    }>;
    filePath: string;
    overrides: null | {
        name: string | null;
        package: string | null;
    };
}

export type UnifyTypeOrInterfaceErrors =
    | EmptyShapeException
    | FailedToUnifyTypeOfInterface<
          ParsingError | ToJavaSyntaxError | UnexpectedDeclarationTypeError
      >;

export const unifyTypeOrInterface = (
    node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration,
    type: ts.Type,
    filePath: string,
    checker: ts.TypeChecker
): ReaderEither<
    ParserConfig,
    UnifyTypeOrInterfaceErrors,
    SimplifiedInterface
> => (config) => {
    const fields: SimplifiedInterface["fields"] = [];

    const props = type.getProperties();

    if (props.length === 0)
        return left(
            new EmptyShapeException(node.name.escapedText.toString(), filePath)
        );

    for (const symbol of props) {
        let userInput: undefined | UserType = undefined;

        if (symbol.declarations.length > 0) {
            const declaration = symbol.declarations[0];
            if (
                ts.isPropertySignature(declaration) ||
                ts.isMethodSignature(declaration)
            ) {
                if (config.ignoreField(declaration)) {
                    continue;
                }

                const inJava = getInJavaDeclaration(declaration)(config);

                if (isSome(inJava)) {
                    if (isRight(inJava.value)) {
                        userInput = inJava.value.right;
                    } else {
                        return left(
                            new FailedToUnifyTypeOfInterface(
                                node.name.escapedText.toString(),
                                filePath,
                                inJava.value.left
                            )
                        );
                    }
                }
                if (ts.isPropertySignature(declaration)) {
                    fields.push({
                        name: symbol.name,
                        node: declaration.type,
                        type: checker.getTypeAtLocation(declaration.type),
                        userInput,
                    });
                } else {
                    const type = checker.getTypeAtLocation(declaration);
                    fields.push({
                        name: symbol.name,
                        node: checker.typeToTypeNode(
                            type,
                            undefined,
                            undefined
                        ),
                        type,
                        userInput,
                    });
                }
                // initialization using typeof
            } else if (
                ts.isPropertyAssignment(declaration) ||
                ts.isMethodDeclaration(declaration)
            ) {
                const type = checker.getTypeAtLocation(declaration);
                fields.push({
                    name: symbol.name,
                    node: checker.typeToTypeNode(type, undefined, undefined),
                    type,
                    userInput,
                });
            } else {
                return left(
                    new FailedToUnifyTypeOfInterface(
                        node.name.escapedText.toString(),
                        filePath,
                        new UnexpectedDeclarationTypeError(
                            symbol.name,
                            ts.SyntaxKind[declaration.kind]
                        )
                    )
                );
            }
        }
    }

    if (config.interfacePredicateRegexp) {
        return pipe(
            getComments(node),
            getOrElse(() => new Array<string>()),
            (lines) =>
                lines.find((line) =>
                    config.interfacePredicateRegexp.test(line)
                ),
            (directive) =>
                parseToJavaString(directive, config.interfacePredicateRegexp),
            map((overrides) => ({
                name: node.name.escapedText.toString(),
                fields,
                filePath,
                overrides: overrides.isEmpty
                    ? null
                    : {
                          name: overrides.name,
                          package: overrides.package,
                      },
            })),
            mapLeft(
                (e) =>
                    new FailedToUnifyTypeOfInterface(
                        node.name.escapedText.toString(),
                        filePath,
                        e
                    )
            )
        );
    }

    return right({
        name: node.name.escapedText.toString(),
        fields,
        filePath,
        overrides: null,
    });
};
