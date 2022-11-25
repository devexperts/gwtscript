/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";

import * as ReaderEither from "fp-ts/lib/ReaderEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as Option from "fp-ts/lib/Option";
import * as Either from "fp-ts/lib/Either";
import * as Array from "fp-ts/lib/Array";

import {
    ParseToJavaResult,
    ToJavaSyntaxError,
} from "@root/utils/parseToJavaString";
import { getComments } from "@root/utils/getComments";

import { ParserConfig } from "./parser.model";

export class NoCommentLines extends Error {
    constructor() {
        super("No comments presented");
        Object.setPrototypeOf(this, NoCommentLines.prototype);
    }
}

export type CheckMarkingDirectiveResult = {
    node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
    overrides: ParseToJavaResult;
};

export const checkMarkingDirective = <
    ParserFunctionError extends Error = ToJavaSyntaxError
>(
    parserFunction: (
        src: string,
        directiveRegExp: RegExp
    ) => Either.Either<ParserFunctionError, ParseToJavaResult>
) => (
    node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration
): ReaderEither.ReaderEither<
    ParserConfig,
    ParserFunctionError | NoCommentLines,
    CheckMarkingDirectiveResult
> =>
    pipe(
        ReaderEither.ask<ParserConfig>(),
        ReaderEither.chain((config) =>
            !config.interfacePredicateRegexp
                ? ReaderEither.right({
                      node,
                      overrides: {
                          isEmpty: true as boolean,
                          name: null,
                          package: null,
                      },
                  })
                : pipe(
                      getComments(node),
                      Option.chain((line) => Array.last(line)),
                      ReaderEither.fromOption(() => new NoCommentLines()),
                      ReaderEither.chain(
                          flow(
                              (line) =>
                                  parserFunction(
                                      line,
                                      config.interfacePredicateRegexp
                                  ),
                              ReaderEither.fromEither
                          )
                      ),
                      ReaderEither.map((overrides) => ({
                          node,
                          overrides,
                      }))
                  )
        )
    );
