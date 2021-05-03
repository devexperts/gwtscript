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
    | UserType;

export interface TypeToGenerate {
    name: string;
    fields: readonly TypeField[];
    sourcePath: string;
}

export interface ParserOutput {
    typesToGenerate: readonly TypeToGenerate[];
}

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

export class PrimitiveType extends Type<"primitive", keyof PrimitiveTypes> {
    identifier: "primitive" = "primitive";
}

export class FunctionType extends Type<"function", ParsedType> {
    identifier: "function" = "function";

    constructor(type: ParsedType, public parameters: readonly ParsedType[]) {
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

export class UnionType extends Type<"union", readonly ParsedType[]> {
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
