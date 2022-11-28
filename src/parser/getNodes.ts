/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { flow, pipe } from "fp-ts/lib/function";
import * as Reader from "fp-ts/lib/Reader";
import * as array from "fp-ts/lib/Array";
import * as Option from "fp-ts/lib/Option";

import { ParserConfig } from "./parser.model";

export type MarkedNode = {
    filePath: string;
    name: string;
    node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
};

/**
 *
 * @param program TypeScript program
 * @returns nodes and filepaths that satisfies predicate
 *
 * @description
 * This function is only responsible for types extraction
 */
export const getNodes = (
    program: ts.Program
): Reader.Reader<ParserConfig, MarkedNode[]> =>
    pipe(
        Reader.ask<ParserConfig>(),
        Reader.map((config) =>
            pipe(
                program.getRootFileNames(),
                array.filterMap((path) =>
                    pipe(
                        Option.fromNullable(
                            !config.filePredicate
                                ? path
                                : config.filePredicate(path)
                                ? path
                                : null
                        ),
                        Option.map((path) =>
                            Array.from(program.getSourceFile(path).statements)
                        ),
                        Option.map(
                            flow(
                                array.filterMap((statement) =>
                                    Option.fromNullable(
                                        (ts.isTypeAliasDeclaration(statement) ||
                                            ts.isInterfaceDeclaration(
                                                statement
                                            )) &&
                                            config.interfacePredicate(statement)
                                            ? statement
                                            : null
                                    )
                                ),
                                array.map((node) => ({
                                    node,
                                    filePath: path,
                                    name: node.name.escapedText.toString(),
                                }))
                            )
                        )
                    )
                ),
                array.flatten
            )
        )
    );
