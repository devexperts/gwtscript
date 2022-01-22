/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { isRight, left, right } from "fp-ts/lib/Either";
import { ReaderEither } from "fp-ts/lib/ReaderEither";

import { ParserConfig } from "./parser.model";
import { UserType } from "../model";
import { parseInJavaString, ParsingError } from "../utils/parseInJavaString";
import {
    EmptyShapeException,
    UnexpectedDeclarationTypeError,
} from "./parser.errors";

export interface SimplifiedInterface {
    name: string;
    fields: Array<{
        name: string;
        node: ts.TypeNode;
        type: ts.Type;
        userInput?: UserType;
    }>;
    filePath: string;
}
export const unifyTypeOrInterface = (
    node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration,
    type: ts.Type,
    filePath: string,
    checker: ts.TypeChecker
): ReaderEither<
    ParserConfig,
    EmptyShapeException | ParsingError,
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
                const text = declaration.getFullText();
                const ranges = ts.getLeadingCommentRanges(text, 0);
                const inJavaComment = ranges?.find((item) => {
                    const comment = text.slice(item.pos, item.end);
                    if (config.inJavaRegExpTest.test(comment)) return true;
                });
                if (inJavaComment) {
                    const result = parseInJavaString(
                        text.slice(inJavaComment.pos, inJavaComment.end),
                        config
                    );
                    if (isRight(result)) {
                        userInput = result.right;
                    } else {
                        return result;
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
                    new UnexpectedDeclarationTypeError(
                        symbol.name,
                        node.name.escapedText.toString(),
                        filePath,
                        ts.SyntaxKind[declaration.kind]
                    )
                );
            }
        }
    }

    return right({
        name: node.name.escapedText.toString(),
        fields,
        filePath,
    });
};
