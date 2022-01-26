/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either, right, isLeft } from "fp-ts/lib/Either";

export const combineEithers = <AError, A, BError, B, Result>(
    a: Either<AError, A>,
    b: Either<BError, B>,
    mapper: (a: A, b: B) => Result
): Either<AError | BError, Result> => {
    if (isLeft(a)) return a;
    if (isLeft(b)) return b;

    return right(mapper(a.right, b.right));
};
