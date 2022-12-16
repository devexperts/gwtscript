/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { pipe } from "fp-ts/lib/function";
import * as ReaderEither from "fp-ts/lib/ReaderEither";

import { Field } from "./getFields";

import { TypeField } from "../model";
import { parseTypeNode, ParseTypeNodeError } from "./parseTypeNode";
import { ParserConfig } from "./parser.model";

export class FailedToParseField extends Error {
    constructor(public fieldName: string, public error: ParseTypeNodeError) {
        super(`Failed to parse field "${fieldName}"`);
        Object.setPrototypeOf(this, FailedToParseField.prototype);
    }
}

export const toTypedField = (
    typeName: string,
    location: string,
    checker: ts.TypeChecker
) => (
    field: Field
): ReaderEither.ReaderEither<ParserConfig, FailedToParseField, TypeField> =>
    field.userInput
        ? ReaderEither.right({
              name: field.name,
              type: field.userInput,
          })
        : pipe(
              ReaderEither.ask<ParserConfig>(),
              ReaderEither.chainW(() =>
                  parseTypeNode(
                      field.node,
                      checker,
                      checker.getTypeAtLocation(field.node),
                      {
                          fieldName: field.name,
                          location,
                          typeName,
                      }
                  )
              ),
              ReaderEither.map((type) => ({
                  type,
                  name: field.name,
              })),
              ReaderEither.mapLeft((e) => new FailedToParseField(field.name, e))
          );
