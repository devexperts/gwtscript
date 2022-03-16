/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either, left, right } from "fp-ts/lib/Either";

export interface ParseToJavaResult {
    isEmpty: boolean;
    package: string | null;
    name: string | null;
}

export class ToJavaSyntaxError extends Error {
    constructor(public comment: string, public text: string) {
        super(text);
        Object.setPrototypeOf(this, ToJavaSyntaxError.prototype);
    }
}

/**
 *
 * @param src source comment (@ToJava as Name to Package)
 * @param toJavaRegexp Marking directive regexp
 * @returns parsing result(package and name)
 *
 * @description
 *
 * we accept 5 cases(Marking keyword excluded):
 *  1. as Name to Package(and vise-versa)
 *  2. as Name
 *  3. to Package
 *  4. Package
 *  5. Package as Name
 */
export const parseToJavaString = (
    src: string,
    toJavaRegexp: RegExp
): Either<ToJavaSyntaxError, ParseToJavaResult> => {
    if (src.search(toJavaRegexp) !== 0)
        return left(
            new ToJavaSyntaxError(
                src,
                `Marking directive must be at the the beginning of "${src}"`
            )
        );

    const normalized = src.replace(toJavaRegexp, "").trim();

    const result: ParseToJavaResult = {
        isEmpty: true,
        name: null,
        package: null,
    };
    if (normalized.length === 0) return right(result);

    const tokens = normalized.split(/\s+/);
    const asIndex = tokens.indexOf("as");

    if (asIndex !== -1) {
        result.isEmpty = false;
        const name = tokens[asIndex + 1];
        if (!name || name === "to")
            return left(
                new ToJavaSyntaxError(
                    src,
                    `No name specified after "as" keyword in "${src}"`
                )
            );
        tokens.splice(asIndex, 2);
        result.name = name;
    }

    const toIndex = tokens.indexOf("to");

    if (toIndex !== -1) {
        result.isEmpty = false;
        const pack = tokens[toIndex + 1];
        if (!pack)
            return left(
                new ToJavaSyntaxError(
                    src,
                    `No package specified after "to" keyword in "${src}"`
                )
            );
        tokens.splice(toIndex, 2);
        result.package = pack;
    }

    if (tokens.length > 0 && !result.package) {
        result.isEmpty = false;
        result.package = tokens[0];
        tokens.splice(0, 1);
    }

    if (tokens.length > 0) {
        return left(
            new ToJavaSyntaxError(
                src,
                `Unknown keywords "${tokens.join(" ")}" in "${src}"`
            )
        );
    }

    if (result.package && /[A-Z]+/.test(result.package))
        return left(
            new ToJavaSyntaxError(
                src,
                `Package contains upper-case in "${src}"`
            )
        );

    return right(result);
};
