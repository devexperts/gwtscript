import * as ts from "typescript";
import { NumberLiteral, ParsedType, StringLiteral, UnionType } from "../model";

import { PrimitiveType } from "../model";

import { Option, some, none, sequenceArray, map } from "fp-ts/Option";
import { pipe } from "fp-ts/lib/pipeable";

export const getParsedType = (type: ts.Type): Option<ParsedType> => { 
    switch (type.flags) {
        case ts.TypeFlags.Number:
            return some(new PrimitiveType("NUMBER"));
        case ts.TypeFlags.String:
            return some(new PrimitiveType("STRING"));
        case ts.TypeFlags.BooleanLiteral:
            return some(new PrimitiveType("BOOLEAN"));
        case ts.TypeFlags.Null:
        case ts.TypeFlags.Undefined:
        case ts.TypeFlags.Void:
            return some(new PrimitiveType("VOID"));
    }

    if (type.isStringLiteral()) return some(new StringLiteral(type.value));
    if (type.isNumberLiteral()) return some(new NumberLiteral(type.value));

    if (type.isUnion()) {
        if (
            type.types.length === 2 &&
            type.types[0].flags === ts.TypeFlags.BooleanLiteral &&
            type.types[1].flags === ts.TypeFlags.BooleanLiteral
        )
            return some(new PrimitiveType("BOOLEAN"));

        return pipe(
            sequenceArray(type.types.map(getParsedType)),
            map(booleanDedup),
            map((types) => new UnionType(types))
        );
    }

    return none;
};

const booleanDedup = (types: ParsedType[]): ParsedType[] => {
    const result: ParsedType[] = [];

    for(const type of types) {
        const last = result[result.length - 1]
        if(last && last.identifier === "primitive" && type.identifier === "primitive" && last.type === "BOOLEAN" && type.type === "BOOLEAN") {
            continue;
        }
        result.push(type);
    }

    return result;
}