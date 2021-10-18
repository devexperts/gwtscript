/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { ParserConfig } from "./parser.model";
import { Option, none, some, isSome } from "fp-ts/Option";

import {
    SimplifiedInterface,
    unifyTypeOrInterface,
} from "./unifyTypeOrInterface";

export const getNodesToTranspile = (
    program: ts.Program,
    config: ParserConfig
): Option<SimplifiedInterface[]> => {
    const fileNames = program.getRootFileNames();

    const results: SimplifiedInterface[] = [];

    const checker = program.getTypeChecker();

    for (const name of fileNames) {
        if (config.filePredicate && !config.filePredicate(name)) continue;

        const ast = program.getSourceFile(name);
        for (const node of ast.statements) {
            if (
                (ts.isTypeAliasDeclaration(node) ||
                    ts.isInterfaceDeclaration(node)) &&
                config.interfacePredicate(node)
            ) {
                const checked = checker.getTypeAtLocation(node);

                // check that type is a shape declaration
                if (!checked.symbol?.declarations?.length) continue;
                const simplified = unifyTypeOrInterface(
                    node,
                    checked,
                    config,
                    name,
                    checker
                );

                if (isSome(simplified)) {
                    results.push(simplified.value);
                    continue;
                }

                return none;
            }
        }
    }

    if (config.logs) {
        console.log(`# Entities to transpile: ${results.length}`);
        for (const int of results) {
            console.log(`## ${int.name}`);
            console.log(`### path: ${int.filePath}`);
        }
    }

    return some(results);
};
