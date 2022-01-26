/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { pipe } from "fp-ts/lib/pipeable";
import { ask, bimap, chain, ReaderEither } from "fp-ts/lib/ReaderEither";

import { sequenceReaderEither } from "@root/utils/sequenceReaderEither";

import { ParserOutput } from "../model";
import { generateType } from "./generateType";
import { GeneratorConfig } from "./generator.config";
import { CannotGenerateTypesError } from "./generator.errors";
import { GeneratorResult } from "./model";
import { TypeToStringError } from "./typeToString";

export const generate = (
    parserOutput: ParserOutput
): ReaderEither<
    GeneratorConfig,
    CannotGenerateTypesError<TypeToStringError>,
    GeneratorResult[]
> => {
    return pipe(
        ask<GeneratorConfig>(),
        chain(() =>
            sequenceReaderEither(
                parserOutput.typesToGenerate.map((t) => generateType(t))
            )
        ),
        bimap(
            (errors) => new CannotGenerateTypesError(errors),
            (value) => value
        )
    );
};
