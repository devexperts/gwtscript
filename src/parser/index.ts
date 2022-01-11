/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either, chainW, map } from "fp-ts/Either";
import { pipe } from "fp-ts/lib/pipeable";
import * as ts from "typescript";

import { ParsingError } from "@root/utils/parseInJavaString";

import { ParserOutput } from "../model";
import { createProgram } from "../utils/createProgram";
import { getNodesToTranspile } from "./getNodesToTranspile";
import { mapSimplifiedInterfaces } from "./mapSimplifiedInterfaces";
import {
    CannotFindConfigError,
    MapSimplifiedInterfacesError,
} from "./parser.errors";
import { ParserConfig } from "./parser.model";

export const parse = (
    config: ParserConfig
): Either<
    MapSimplifiedInterfacesError | ParsingError | CannotFindConfigError,
    ParserOutput
> => {
    return pipe(
        createProgram(config.tsconfigAbsolutePath),
        chainW((program: ts.Program) =>
            pipe(
                getNodesToTranspile(program, config),
                chainW((nodes) =>
                    mapSimplifiedInterfaces(
                        nodes,
                        program.getTypeChecker(),
                        config
                    )
                )
            )
        ),
        map((typesToGenerate) => ({
            typesToGenerate,
        }))
    );
};

export * as ParserErrors from "./parser.errors";
