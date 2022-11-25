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
import { chalk } from "@root/utils/chalk";
import { UserType } from "@root/model";
import { getComments } from "@root/utils/getComments";
import { sequenceEither } from "@root/utils/fp-ts/sequenceEither";

import { ParserConfig } from "./parser.model";

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

export type AcceptableFieldType =
    | ts.PropertySignature
    | ts.MethodSignature
    | ts.PropertyAssignment
    | ts.MethodDeclaration;

export const getFields = <ParserFunctionError extends Error>(
    checker: ts.TypeChecker,
    parseUserType: (
        userDirectiveRegExp: RegExp
    ) => (comment: string) => Either.Either<ParserFunctionError, UserType>
) => (
    node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration
): ReaderEither.ReaderEither<
    ParserConfig,
    FailedToParseUserDirective<ParserFunctionError>[] | NotAnObjectException,
    Field[]
> =>
    pipe(
        ReaderEither.Do,
        ReaderEither.bind("config", () => ReaderEither.ask<ParserConfig>()),
        ReaderEither.let("nodeType", () => checker.getTypeAtLocation(node)),
        ReaderEither.let("props", ({ nodeType }) => nodeType.getProperties()),
        ReaderEither.filterOrElseW(
            ({ nodeType }) =>
                !!nodeType.symbol ||
                (ts.isTypeAliasDeclaration(node) &&
                    ts.isIntersectionTypeNode(node.type)),
            () => new NotAnObjectException()
        ),
        ReaderEither.chain(({ props, config }) =>
            ts.isTypeAliasDeclaration(node) &&
            ts.isIntersectionTypeNode(node.type)
                ? pipe(
                      Array.from(node.type.types),
                      array.map((t) =>
                          getFields(
                              checker,
                              parseUserType
                          )(
                              (t as unknown) as
                                  | ts.TypeAliasDeclaration
                                  | ts.InterfaceDeclaration
                          )
                      ),
                      sequenceReaderEither,
                      ReaderEither.map((items) => items.flatMap((a) => a)),
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
                                          (
                                              declaration
                                          ): declaration is AcceptableFieldType =>
                                              ts.isPropertySignature(
                                                  declaration
                                              ) ||
                                              ts.isMethodSignature(
                                                  declaration
                                              ) ||
                                              ts.isPropertyAssignment(
                                                  declaration
                                              ) ||
                                              ts.isMethodDeclaration(
                                                  declaration
                                              )
                                                  ? true
                                                  : (console.log(
                                                        chalk.bgYellow.black(
                                                            `Unknown field declaration type ${
                                                                ts.ScriptKind[
                                                                    declaration
                                                                        .kind
                                                                ]
                                                            }`
                                                        )
                                                    ),
                                                    false)
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
                              Option.let("userInput", ({ declaration }) => {
                                  return pipe(
                                      getComments(declaration),
                                      Option.chain(
                                          array.findFirst((line) =>
                                              config.inJavaRegExpTest.test(line)
                                          )
                                      ),
                                      Option.map(
                                          parseUserType(config.inJavaRegExpTest)
                                      )
                                  );
                              }),
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
                                  > => {
                                      return pipe(
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
                                      );
                                  }
                              )
                          )
                      ),
                      sequenceEither,
                      ReaderEither.fromEither
                  )
        )
    );
