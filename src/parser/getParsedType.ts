/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { pipe } from "fp-ts/lib/pipeable";
import { ReaderEither } from "fp-ts/lib/ReaderEither";
import { right, left, map as mapEither, mapLeft } from "fp-ts/lib/Either";

import { sequenceReaderEither } from "@root/utils/sequenceReaderEither";

import {
    NumberLiteral,
    ParsedType,
    StringLiteral,
    UnionType,
    PrimitiveType,
} from "../model";
import { CannotParseTypeError, FailedToParseUnionError } from "./parser.errors";

export interface GetParsedTypeEnv {
    fieldName: string;
    typeName: string;
    location: string;
}

export type GetParsedTypeError =
    | CannotParseTypeError
    | FailedToParseUnionError<GetParsedTypeError>;

export const getParsedType = (
    type: ts.Type
): ReaderEither<GetParsedTypeEnv, GetParsedTypeError, ParsedType> => (env) => {
    switch (type.flags) {
        case ts.TypeFlags.Number:
            return right(new PrimitiveType("NUMBER"));
        case ts.TypeFlags.String:
            return right(new PrimitiveType("STRING"));
        case ts.TypeFlags.BooleanLiteral:
            return right(new PrimitiveType("BOOLEAN"));
        case ts.TypeFlags.Null:
        case ts.TypeFlags.Undefined:
        case ts.TypeFlags.Void:
            return right(new PrimitiveType("VOID"));
    }

    if (type.isStringLiteral()) return right(new StringLiteral(type.value));
    if (type.isNumberLiteral()) return right(new NumberLiteral(type.value));

    if (type.isUnion()) {
        if (
            type.types.length === 2 &&
            type.types[0].flags === ts.TypeFlags.BooleanLiteral &&
            type.types[1].flags === ts.TypeFlags.BooleanLiteral
        )
            return right(new PrimitiveType("BOOLEAN"));

        return pipe(
            env,
            sequenceReaderEither(type.types.map(getParsedType)),
            mapEither(booleanDedup),
            mapEither((types) => new UnionType(types)),
            mapLeft(
                (errs) =>
                    new FailedToParseUnionError(
                        env.typeName,
                        env.fieldName,
                        env.location,
                        errs
                    )
            )
        );
    }

    return left(
        new CannotParseTypeError(
            env.typeName,
            env.fieldName,
            env.location,
            type
        )
    );
};

const booleanDedup = (types: ParsedType[]): ParsedType[] => {
    const result: ParsedType[] = [];

    for (const type of types) {
        const last = result[result.length - 1];
        if (
            last &&
            last.identifier === "primitive" &&
            type.identifier === "primitive" &&
            last.type === "BOOLEAN" &&
            type.type === "BOOLEAN"
        ) {
            continue;
        }
        result.push(type);
    }

    return result;
};
