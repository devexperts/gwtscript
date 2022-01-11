/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { left, right } from "fp-ts/lib/Either";
import { ReaderEither } from "fp-ts/lib/ReaderEither";

export const sequenceReaderEither = <Env, Left, Right>(
    items: ReaderEither<Env, Left, Right>[]
): ReaderEither<Env, Left[], Right[]> => (env) => {
    const errors: Left[] = [];
    const values: Right[] = [];

    items.forEach((reader) => {
        const either = reader(env);

        if (either._tag === "Left") {
            errors.push(either.left);
        } else {
            values.push(either.right);
        }
    });

    if (errors.length > 0) {
        return left(errors);
    }

    return right(values);
};
