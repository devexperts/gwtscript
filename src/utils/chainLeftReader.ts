/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { mapLeft, ReaderEither } from "fp-ts/lib/ReaderEither";

import { joinLeftReader } from "./joinLeftReader";

export const chainLeftReader = <E, L, R>(mapper: (e: E) => Either<L, R>) => <
    Env,
    Right
>(
    readerEither: ReaderEither<Env, E, Right>
): ReaderEither<Env, L | R, Right> => {
    return pipe(readerEither, mapLeft(mapper), joinLeftReader);
};
