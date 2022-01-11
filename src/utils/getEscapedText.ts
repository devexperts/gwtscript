/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { PropertyName } from "typescript";
import { Either, left, right } from "fp-ts/lib/Either";

import { FailedToGetEscapedName } from "@root/parser/parser.errors";

export class CannotGetEscapedTextError extends Error {
    constructor(public target: PropertyName) {
        super("Cannot get escapedName");
    }
}

export const getEscapedText = (
    name: PropertyName
): Either<FailedToGetEscapedName, string> => {
    if ("escapedText" in name) {
        return right(name.escapedText.toString());
    }
    return left(new FailedToGetEscapedName(name));
};
