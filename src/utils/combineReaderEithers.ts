/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { ReaderEither } from "fp-ts/lib/ReaderEither";
import { combineEithers } from "./combineEithers";

export const combineReaderEithers = <Env, Left1, Right1, Left2, Right2, Next>(
    reader1: ReaderEither<Env, Left1, Right1>,
    reader2: ReaderEither<Env, Left2, Right2>,
    mapper: (value1: Right1, value2: Right2) => Next
): ReaderEither<Env, Left1 | Left2, Next> => (env) => {
    const either1 = reader1(env);
    const either2 = reader2(env);

    return combineEithers(either1, either2, mapper);
};
