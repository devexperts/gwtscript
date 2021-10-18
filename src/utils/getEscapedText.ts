/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { none, Option, some } from "fp-ts/lib/Option";
import { PropertyName } from "typescript";

export class CannotGetEscapedTextError extends Error {
    constructor(public target: PropertyName) {
        super("Cannot get escapedName");
    }
}

export const getEscapedText = (name: PropertyName): Option<string> => {
    if ("escapedText" in name) {
        return some(name.escapedText.toString());
    }
    return none;
};
