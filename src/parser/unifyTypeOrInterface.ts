/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { Either, isRight, left, right } from "fp-ts/lib/Either";

import { ParserConfig } from "./parser.model";
import { UserType } from "../model";
import { parseInJavaString, ParsingError } from "../utils/parseInJavaString";
import { EmptyShapeException } from "./parser.errors";

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
    config: ParserConfig,
    filePath: string,
    checker: ts.TypeChecker
): Either<EmptyShapeException | ParsingError, SimplifiedInterface> => {
    const fields: SimplifiedInterface["fields"] = [];

    const props = type.getProperties();

    if (props.length === 0) return left(new EmptyShapeException(node.name.escapedText.toString(), filePath));

    for (const symbol of props) {
        let userInput: undefined | UserType = undefined;

        if (config.ignoreField && symbol.declarations?.length > 0) {
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
            }
        }

        const checkedType = checker.getTypeOfSymbolAtLocation(symbol, node);

        fields.push({
            name: symbol.name,
            node: checker.typeToTypeNode(checkedType, undefined, undefined),
            type: checkedType,
            userInput,
        });
    }

    return right({
        name: node.name.escapedText.toString(),
        fields,
        filePath,
    });
};
