/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { pipe } from "fp-ts/lib/pipeable";
import * as ts from "typescript";
import {
    ask,
    chain,
    chainW,
    fromEither,
    ReaderEither,
    map,
} from "fp-ts/lib/ReaderEither";

import { ParserOutput } from "../model";
import { createProgram } from "../utils/createProgram";
import { getNodesToTranspile } from "./getNodesToTranspile";
import { mapSimplifiedInterfaces } from "./mapSimplifiedInterfaces";
import {
    CannotFindConfigError,
    EmptyShapeException,
    FailedToParseInterface,
    MapSimplifiedInterfacesError,
} from "./parser.errors";
import { ParserConfig } from "./parser.model";
import { ParseTypeNodeError } from "./parseTypeNode";
import { UnifyTypeOrInterfaceErrors } from "./unifyTypeOrInterface";

export type ParserError =
    | MapSimplifiedInterfacesError<FailedToParseInterface<ParseTypeNodeError>>
    | CannotFindConfigError
    | EmptyShapeException
    | UnifyTypeOrInterfaceErrors;

export const parse = (): ReaderEither<
    ParserConfig,
    ParserError,
    ParserOutput
> => {
    return pipe(
        ask<ParserConfig>(),
        chain((config) =>
            fromEither(createProgram(config.tsconfigAbsolutePath))
        ),
        chainW((program: ts.Program) =>
            pipe(
                getNodesToTranspile(program),
                chainW((nodes) =>
                    mapSimplifiedInterfaces(nodes, program.getTypeChecker())
                )
            )
        ),
        map((typesToGenerate) => ({
            typesToGenerate,
        }))
    );
};

export * as ParserErrors from "./parser.errors";
