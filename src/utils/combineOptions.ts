/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Option, ap, map } from "fp-ts/Option";

export const combineOptions = <A, B, Result>(
    a: Option<A>,
    b: Option<B>,
    mapper: (a: A, b: B) => Result
): Option<Result> => {
    return ap(a)(map((valueB: B) => (valueA: A) => mapper(valueA, valueB))(b));
};
