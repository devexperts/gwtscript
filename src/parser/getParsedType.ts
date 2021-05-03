import * as ts from "typescript";
import { ParsedType } from "../model";

import { PrimitiveType } from "../model";

import { Option, some, none } from "fp-ts/Option";

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

    if (
        type.isUnion() &&
        type.types.length === 2 &&
        type.types[0].flags === ts.TypeFlags.BooleanLiteral &&
        type.types[1].flags === ts.TypeFlags.BooleanLiteral
    ) {
        return some(new PrimitiveType("BOOLEAN"));
    }

    return none;
};
