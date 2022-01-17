/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { ReaderEither } from "fp-ts/lib/ReaderEither";

import { joinLeft } from "./joinLeft";

export const joinLeftReader = <E, LL, LR, R>(
    reader: ReaderEither<E, Either<LL, LR>, R>
): ReaderEither<E, LL | LR, R> => (env) => {
    return pipe(env, reader, joinLeft);
};
