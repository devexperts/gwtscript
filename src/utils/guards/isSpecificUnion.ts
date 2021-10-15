import {
    NumberLiteral,
    ParsedType,
    StringLiteral,
    UnionType,
} from "../../model";

export const isSpecificUnion = <Type extends ParsedType>(
    union: UnionType,
    predicate: (element: ParsedType) => element is Type
): union is UnionType<Type> => {
    for (const type of union.type) {
        if (!predicate(type)) return false;
    }

    return true;
};

export const isStringUnion = (
    union: UnionType
): union is UnionType<StringLiteral> =>
    isSpecificUnion(
        union,
        (type): type is StringLiteral => type instanceof StringLiteral
    );
export const isNumberUnion = (
    union: UnionType
): union is UnionType<NumberLiteral> =>
    isSpecificUnion(
        union,
        (type): type is NumberLiteral => type instanceof NumberLiteral
    );
