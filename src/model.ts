/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { GeneratorConfig } from "./generator/generator.config";
import { ParserConfig } from "./parser/parser.model";

export type UserParserConfig = Omit<
    ParserConfig,
    | "interfacePredicate"
    | "ignoreField"
    | "nativeReferences"
    | "inJavaRegExpTest"
> & {
    interfacePredicate?: ParserConfig["interfacePredicate"] | RegExp;
    ignoreField?: ParserConfig["ignoreField"] | RegExp;
    inJavaRegExpTest?: ParserConfig["inJavaRegExpTest"];
    nativeReferencesMap?: GeneratorConfig["nativeReferencesMap"];
};

export type CompilerConfig = UserParserConfig &
    Omit<GeneratorConfig, "nativeReferencesMap">;

export interface TypeField {
    name: string;
    type: ParsedType;
}

export type ParsedType =
    | PrimitiveType
    | FunctionType
    | ObjectType
    | ArrayType
    | UnionType
    | ReferenceType
    | UserType
    | NumberLiteral
    | StringLiteral;

export interface TypeToGenerate {
    name: string;
    fields: readonly TypeField[];
    sourcePath: string;
    overrides: null | {
        name: string | null;
        package: string | null;
    };
}

export interface ParserOutput {
    typesToGenerate: readonly TypeToGenerate[];
}

export type RefableType =
    | ObjectType
    | UnionType<StringLiteral>
    | UnionType<NumberLiteral>;

export abstract class Type<ID, T> {
    public abstract identifier: ID;
    constructor(public type: T) {}
}

export type PrimitiveTypes = {
    NUMBER: true;
    STRING: true;
    BOOLEAN: true;
    VOID: true;
    ANY: true;
};

export class Literal<T extends number | string> extends Type<"literal", T> {
    identifier: "literal" = "literal";
}

export class NumberLiteral extends Literal<number> {}

export class StringLiteral extends Literal<string> {}

export class PrimitiveType extends Type<"primitive", keyof PrimitiveTypes> {
    identifier: "primitive" = "primitive";
}

export class FunctionType extends Type<"function", ParsedType> {
    identifier: "function" = "function";

    constructor(
        type: ParsedType,
        public parameters: ReadonlyArray<{ name: string; type: ParsedType }>
    ) {
        super(type);
    }
}

export class ObjectType extends Type<
    "object",
    ReadonlyArray<{ name: string; type: ParsedType }>
> {
    identifier: "object" = "object";
    constructor(
        value: ReadonlyArray<{ name: string; type: ParsedType }>,
        public nameNotation?: string
    ) {
        super(value);
    }
}

export class ArrayType extends Type<"array", ParsedType> {
    identifier: "array" = "array";
}

export class UnionType<T extends ParsedType = ParsedType> extends Type<
    "union",
    readonly T[]
> {
    identifier: "union" = "union";
}

export class ReferenceType extends Type<
    "reference",
    { typeName: string; genericArgs: readonly ParsedType[] }
> {
    identifier: "reference" = "reference";
}

export class UserType extends Type<
    "hard-coded-type",
    { text: string; imports: string[] }
> {
    identifier: "hard-coded-type" = "hard-coded-type";
}
