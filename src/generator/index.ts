/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { bimap, Either } from "fp-ts/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { flatten } from "fp-ts/lib/Array";

import { ParserOutput } from "../model";
import { generateType } from "./generateType";
import { GeneratorConfig } from "./generator.config";
import { FailedToGenerateFieldsOnTypes } from "./generator.errors";
import { GeneratorResult } from "./model";
import { sequenceEither } from "../utils/sequenceEither";

export const generate = (config: GeneratorConfig) => (
    parserOutput: ParserOutput
): Either<FailedToGenerateFieldsOnTypes, GeneratorResult[]> => {
    return pipe(
        sequenceEither(
            parserOutput.typesToGenerate.map((t) => generateType(t, config))
        ),
        bimap(
            (errors) => new FailedToGenerateFieldsOnTypes(errors),
            (value) => flatten(value)
        )
    );
};
