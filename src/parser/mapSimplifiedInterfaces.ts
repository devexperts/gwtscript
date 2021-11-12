/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { SimplifiedInterface } from "./unifyTypeOrInterface";
import { TypeToGenerate } from "../model";

import { parseTypeNode } from "./parseTypeNode";
import * as ts from "typescript";

import { Option, sequenceArray, map, some } from "fp-ts/Option";
import { ParserConfig } from "./parser.model";
import { pipe } from "fp-ts/lib/function";

export const mapSimplifiedInterfaces = (
    interfaces: SimplifiedInterface[],
    checker: ts.TypeChecker,
    config: ParserConfig
): Option<readonly TypeToGenerate[]> => {
    return sequenceArray(
        interfaces.map((node) => {
            return pipe(
                sequenceArray(
                    node.fields.map(({ name, type, node, userInput }) => {
                        if (userInput) {
                            return some({
                                name,
                                type: userInput,
                            });
                        }
                        return pipe(
                            parseTypeNode(node, checker, type, config),
                            map((value) => ({
                                name,
                                type: value,
                            }))
                        );
                    })
                ),
                map(
                    (value): TypeToGenerate => ({
                        name: node.name,
                        fields: value,
                        sourcePath: node.filePath,
                    })
                )
            );
        })
    );
};
