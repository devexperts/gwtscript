/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import * as ReaderEither from "fp-ts/lib/ReaderEither";
import * as array from "fp-ts/lib/array";
import * as Option from "fp-ts/lib/Option";
import * as Either from "fp-ts/lib/Either";
import { pipe, flow } from "fp-ts/lib/function";

import { sequenceReaderEither } from "@root/utils/fp-ts/sequenceReaderEither";
import { UserType } from "@root/model";
import { getComments } from "@root/utils/getComments";
import { sequenceEither } from "@root/utils/fp-ts/sequenceEither";

import { ParserConfig } from "./parser.model";
import { declarationIsAcceptableFieldType } from "./utils/declarationIsAcceptableFieldType";

export type Field = {
    name: string;
    node: ts.TypeNode;
    userInput?: UserType;
};

export class NotAnObjectException extends Error {
    constructor() {
        super("Type is not an object type");
        Object.setPrototypeOf(this, NotAnObjectException.prototype);
    }
}

export class FailedToParseUserDirective<E extends Error> extends Error {
    constructor(public fieldName: string, public error: E) {
        super(`Failed to parse user input directive on field "${fieldName}"`);
        Object.setPrototypeOf(this, FailedToParseUserDirective.prototype);
    }
}

export const getFields = <ParserFunctionError extends Error>(
    checker: ts.TypeChecker,
    parseUserType: (
        userDirectiveRegExp: RegExp
    ) => (comment: string) => Either.Either<ParserFunctionError, UserType>
) => (
    objectType: ts.Type
): ReaderEither.ReaderEither<
    ParserConfig,
    FailedToParseUserDirective<ParserFunctionError>[] | NotAnObjectException,
    Field[]
> => {
    return pipe(
        ReaderEither.Do,
        ReaderEither.filterOrElse(
            () => !!objectType.symbol || objectType.isIntersection(),
            () => new NotAnObjectException()
        ),
        ReaderEither.bindW("config", () => ReaderEither.ask<ParserConfig>()),
        ReaderEither.let("props", () => objectType.getProperties()),
        ReaderEither.chain(({ props, config }) =>
            objectType.isIntersection()
                ? pipe(
                      objectType.types,
                      array.map(getFields(checker, parseUserType)),
                      sequenceReaderEither,
                      ReaderEither.map(array.flatten),
                      ReaderEither.mapLeft((errors) => errors[0])
                  )
                : pipe(
                      props,
                      array.filterMap((property) =>
                          pipe(
                              Option.Do,
                              Option.bind(
                                  "declaration",
                                  flow(
                                      () => array.head(property.declarations),
                                      Option.filter(
                                          declarationIsAcceptableFieldType
                                      )
                                  )
                              ),
                              Option.let("name", () =>
                                  property.escapedName.toString()
                              ),
                              Option.filter(
                                  ({ declaration }) =>
                                      !config.ignoreField ||
                                      !config.ignoreField(declaration)
                              ),
                              Option.let(
                                  "userInput",
                                  flow(
                                      ({ declaration }) => declaration,
                                      getComments,
                                      Option.chain(
                                          array.findFirst((line) =>
                                              config.inJavaRegExpTest.test(line)
                                          )
                                      ),
                                      Option.map(
                                          parseUserType(config.inJavaRegExpTest)
                                      )
                                  )
                              ),
                              Option.let("node", ({ declaration }) =>
                                  ts.isPropertySignature(declaration)
                                      ? declaration.type
                                      : checker.typeToTypeNode(
                                            checker.getTypeAtLocation(
                                                declaration
                                            ),
                                            undefined,
                                            undefined
                                        )
                              ),
                              Option.map(
                                  ({
                                      userInput,
                                      node,
                                      name,
                                  }): Either.Either<
                                      FailedToParseUserDirective<ParserFunctionError>,
                                      Field
                                  > =>
                                      pipe(
                                          userInput,
                                          Option.fold(
                                              () =>
                                                  Either.right({ node, name }),
                                              flow(
                                                  Either.bimap(
                                                      (e) =>
                                                          new FailedToParseUserDirective(
                                                              name,
                                                              e
                                                          ),
                                                      (userInput) => ({
                                                          node,
                                                          name,
                                                          userInput,
                                                      })
                                                  )
                                              )
                                          )
                                      )
                              )
                          )
                      ),
                      sequenceEither,
                      ReaderEither.fromEither
                  )
        )
    );
};
