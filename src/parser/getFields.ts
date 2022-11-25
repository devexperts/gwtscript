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
import { pipe, flow } from "fp-ts/lib/function";

import { sequenceReaderEither } from "@root/utils/fp-ts/sequenceReaderEither";
import { chalk } from "@root/utils/chalk";
import { UserType } from "@root/model";

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

export const getFields = (checker: ts.TypeChecker) => (
    node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration
): ReaderEither.ReaderEither<ParserConfig, NotAnObjectException, Field[]> =>
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
                      sequenceReaderEither(
                          node.type.types.map((t) =>
                              getFields(checker)(
                                  (t as any) as
                                      | ts.TypeAliasDeclaration
                                      | ts.InterfaceDeclaration
                              )
                          )
                      ),
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
                                          ): declaration is
                                              | ts.PropertySignature
                                              | ts.MethodSignature
                                              | ts.PropertyAssignment
                                              | ts.MethodDeclaration =>
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
                              Option.map(({ name, declaration }) =>
                                  ts.isPropertySignature(declaration)
                                      ? {
                                            name,
                                            node: declaration.type,
                                        }
                                      : {
                                            name,
                                            node: checker.typeToTypeNode(
                                                checker.getTypeAtLocation(
                                                    declaration
                                                ),
                                                undefined,
                                                undefined
                                            ),
                                        }
                              )
                          )
                      ),
                      ReaderEither.right
                  )
        )
    );
