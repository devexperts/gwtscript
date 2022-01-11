/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { Option, some, none, sequenceArray } from "fp-ts/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { Either, right, map, mapLeft } from "fp-ts/lib/Either";

import { NumberLiteral, ParsedType, StringLiteral, UnionType } from "../model";

import { PrimitiveType } from "../model";
import { sequenceEither } from "@root/utils/sequenceEither";


export const getParsedType = (type: ts.Type): Either<Error, ParsedType> => {
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
            sequenceEither(type.types.map(getParsedType)),
            map(booleanDedup),
            map((types) => new UnionType(types)),
            mapLeft(errs => // HERE)
        );
    }

    return none;
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
