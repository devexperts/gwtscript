/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either, getOrElseW, mapLeft } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";

export const joinLeft = <LL, LR, R>(
    either: Either<Either<LL, LR>, R>
): Either<LL | LR, R> => {
    return pipe(either, mapLeft(getOrElseW((err) => err)));
};
