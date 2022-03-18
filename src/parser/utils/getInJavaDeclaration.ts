/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";

import { map, flatten, Option } from "fp-ts/lib/Option";
import { findFirst } from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { ask, map as mapReader, Reader } from "fp-ts/lib/Reader";
import { Either } from "fp-ts/lib/Either";

import { getComments } from "@root/utils/getComments";
import { parseInJavaString, ParsingError } from "@root/utils/parseInJavaString";
import { UserType } from "@root/model";

import { ParserConfig } from "../parser.model";

export const getInJavaDeclaration = (
    declaration: ts.PropertySignature | ts.MethodSignature
): Reader<ParserConfig, Option<Either<ParsingError, UserType>>> => {
    return pipe(
        ask<ParserConfig>(),
        mapReader((config) =>
            pipe(
                getComments(declaration),
                map(findFirst((line) => config.inJavaRegExpTest.test(line))),
                flatten,
                map((comment) => parseInJavaString(comment, config))
            )
        )
    );
};
