/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either, fromOption } from "fp-ts/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { chain, map } from "fp-ts/Option";
import * as ts from "typescript";
import { ParserOutput } from "../model";
import { createProgram } from "../utils/createProgram";
import { getNodesToTranspile } from "./getNodesToTranspile";
import { mapSimplifiedInterfaces } from "./mapSimplifiedInterfaces";
import { ParserConfig } from "./parser.model";
import { SimplifiedInterface } from "./unifyTypeOrInterface";

export const parse = (config: ParserConfig): Either<unknown, ParserOutput> => {
    return pipe(
        createProgram(config.tsconfigAbsolutePath),
        chain((program: ts.Program) =>
            pipe(
                getNodesToTranspile(program, config),
                chain((nodes: SimplifiedInterface[]) =>
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
        })),
        fromOption(() => "error")
    );
};
