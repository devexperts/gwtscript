/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ReaderEither from "fp-ts/lib/ReaderEither";
import * as Array from "fp-ts/lib/Array";
import { flow, pipe } from "fp-ts/lib/function";

import { parseToJavaString } from "@root/utils/parseToJavaString";
import { sequenceReaderEither } from "@root/utils/fp-ts/sequenceReaderEither";
import { parseInJavaString, ParsingError } from "@root/utils/parseInJavaString";

import { checkMarkingDirective } from "./checkMarkingDirective";
import { getFields } from "./getFields";
import { ParserOutput, TypeToGenerate } from "../model";
import { createProgram } from "../utils/createProgram";
import { ParserConfig } from "./parser.model";
import { getNodes } from "./getNodes";
import { toTypedField } from "./toTypedField";
import {
    CannotFindConfigError,
    FailedToCheckMarkingDirective,
    FailedToParseFields,
    TSCompilerError,
} from "./parser.errors";

export class ParserError extends Error {
    constructor(
        public errors:
            | FailedToCheckMarkingDirective[]
            | FailedToParseFields<ParsingError>[]
            | CannotFindConfigError
            | TSCompilerError
    ) {
        super("Failed to parse types");
        Object.setPrototypeOf(this, ParserError.prototype);
    }
}

export const parse = (): ReaderEither.ReaderEither<
    ParserConfig,
    ParserError,
    ParserOutput
> =>
    pipe(
        ReaderEither.Do,
        ReaderEither.bind("config", () => ReaderEither.ask<ParserConfig>()),
        // Create program
        ReaderEither.bindW(
            "program",
            flow(
                ({ config }) => config.tsconfigAbsolutePath,
                createProgram,
                ReaderEither.fromEither
            )
        ),
        // Get program type checker
        ReaderEither.let("checker", ({ program }) => program.getTypeChecker()),
        // Get nodes to transpile
        ReaderEither.let("nodes", ({ program, config }) =>
            pipe(config, getNodes(program))
        ),
        // Check marking directive on nodes if presented
        ReaderEither.bindW(
            "checked",
            flow(
                ({ nodes }) => nodes,
                Array.map((node) =>
                    pipe(
                        node.node,
                        checkMarkingDirective(parseToJavaString),
                        ReaderEither.mapLeft(
                            (e) =>
                                new FailedToCheckMarkingDirective(
                                    node.name,
                                    node.filePath,
                                    e
                                )
                        )
                    )
                ),
                sequenceReaderEither
            )
        ),
        // Parse type fields
        ReaderEither.bindW("fields", ({ nodes, checker }) =>
            pipe(
                nodes,
                Array.map((node) =>
                    pipe(
                        node.node,
                        checker.getTypeAtLocation,
                        getFields(checker, parseInJavaString),
                        ReaderEither.chainW(
                            flow(
                                Array.map(
                                    toTypedField(
                                        node.name,
                                        node.filePath,
                                        checker
                                    )
                                ),
                                sequenceReaderEither
                            )
                        ),
                        ReaderEither.mapLeft(
                            (e) =>
                                new FailedToParseFields(
                                    node.name,
                                    node.filePath,
                                    e
                                )
                        )
                    )
                ),
                sequenceReaderEither
            )
        ),
        // Compose the result
        ReaderEither.bind("typesToGenerate", ({ fields, checked, nodes }) =>
            ReaderEither.right(
                pipe(
                    nodes,
                    Array.zip(checked),
                    Array.zip(fields),
                    Array.map(
                        ([[node, check], fields]): TypeToGenerate => {
                            return {
                                fields,
                                name: node.name,
                                overrides: check.overrides,
                                sourcePath: node.filePath,
                            };
                        }
                    )
                )
            )
        ),
        ReaderEither.map(({ typesToGenerate }) => ({
            typesToGenerate,
        })),
        ReaderEither.mapLeft((e) => new ParserError(e))
    );
