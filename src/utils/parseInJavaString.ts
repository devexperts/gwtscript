/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either, left, right } from "fp-ts/lib/Either";

import { UserType } from "../model";

export class ParsingError extends Error {
    constructor(public stringToParse: string) {
        super(
            "Failed to parse InJava comment. Example: @InJava {InJavaType} from {import1}, {import2}, {import3}"
        );
    }
    static _create<T>(str: string): Either<ParsingError, T> {
        return left<ParsingError, T>(new ParsingError(str));
    }
}

export const parseInJavaString = (directiveRegExp: RegExp) => (
    str: string
): Either<ParsingError, UserType> => {
    const start = str.match(directiveRegExp);
    const short = str.slice(start.index + start[0].length).trim();
    if (short.length === 0) return ParsingError._create(str);

    const [text, imports] = short.split(/\s+from\s+/);

    if (!text || text.search(/\s+/) !== -1) {
        //check if \s symbols placed in A<B, C> constructions
        if (text.replace(/,\s/, "").search(/\s+/) !== -1)
            return ParsingError._create(str);
    }

    if (!imports) {
        return right(
            new UserType({
                imports: [],
                text: short,
            })
        );
    }

    return right(
        new UserType({
            text,
            imports: imports.split(/\s*,\s*/),
        })
    );
};
