/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either, isLeft, isRight, left, right } from "fp-ts/lib/Either";

export const sequenceEither = <L, R>(
    eithers: Either<L, R>[]
): Either<L[], R[]> => {
    const errors: L[] = [];
    const result: R[] = [];

    eithers.forEach((item) => {
        if (isLeft(item)) {
            errors.push(item.left);
        }
        if (isRight(item)) {
            result.push(item.right);
        }
    });

    if (result.length !== eithers.length) return left(errors);

    return right(result);
};
