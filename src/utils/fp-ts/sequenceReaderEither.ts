/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { isEmpty, partitionMap } from "fp-ts/lib/Array";
import { fromPredicate } from "fp-ts/lib/Either";
import { constant } from "fp-ts/lib/function";
import { pipe } from "fp-ts/lib/pipeable";
import { ReaderEither } from "fp-ts/lib/ReaderEither";

export const sequenceReaderEither = <Env, Left, Right>(
    items: ReaderEither<Env, Left, Right>[]
): ReaderEither<Env, Left[], Right[]> => (env) => {
    return pipe(
        items,
        partitionMap((r) => r(env)),
        ({ left, right }) =>
            pipe(right, fromPredicate(constant(isEmpty(left)), constant(left)))
    );
};
