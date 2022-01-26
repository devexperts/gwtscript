/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { isRight, left, right } from "fp-ts/lib/Either";
import { ReaderEither } from "fp-ts/lib/ReaderEither";

import { chalk } from "@chalk";
import { ParsingError } from "@root/utils/parseInJavaString";

import { ParserConfig } from "./parser.model";
import {
    SimplifiedInterface,
    unifyTypeOrInterface,
} from "./unifyTypeOrInterface";
import { EmptyShapeException } from "./parser.errors";

export const getNodesToTranspile = (
    program: ts.Program
): ReaderEither<ParserConfig, ParsingError, SimplifiedInterface[]> => (
    config
) => {
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
                if (!checked.symbol?.declarations?.length) {
                    console.warn(
                        chalk.bgYellow.black(
                            `Type ${node.name.escapedText} (location: "${name}") was ignored because it's not an object type`
                        )
                    );
                    continue;
                }
                const simplified = unifyTypeOrInterface(
                    node,
                    checked,
                    name,
                    checker
                )(config);

                if (isRight(simplified)) {
                    results.push(simplified.right);
                    continue;
                }

                const error = simplified.left;

                if (error instanceof EmptyShapeException) {
                    console.warn(chalk.bgYellow.black(error.message));
                    continue;
                }

                return left(error);
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

    return right(results);
};
