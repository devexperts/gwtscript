import { Either, left, map, mapLeft, right } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import {
    ArrayType,
    FunctionType,
    ObjectType,
    ParsedType,
    PrimitiveType,
    ReferenceType,
    UnionType,
    UserType,
} from "../model";
import { sequenceEither } from "../utils/sequenceEither";
import { unEither } from "../utils/unEither";
import { GeneratorConfig } from "./generator.config";
import { ReferenceTypeGenericError } from "./generator.errors";

export type TypeToStringResult = { result: string; imports: string[] };

export const typeToString = (
    type: ParsedType,
    config: GeneratorConfig,
    getReferenceTo: (obj: ObjectType) => { name: string }
): Either<Error | ReferenceTypeGenericError, TypeToStringResult> => {
    if (type instanceof PrimitiveType) {
        if (type.type === "VOID") {
            return left(
                new Error("Cannot stringify VOID when it's not a function type")
            );
        }
        if (config.primitiveMapping && config.primitiveMapping[type.type]) {
            return right(config.primitiveMapping[type.type]);
        }
        return right({
            result:
                type.type === "BOOLEAN"
                    ? "boolean"
                    : type.type === "NUMBER"
                    ? "double"
                    : "String",
            imports: [],
        });
    }
    if (type instanceof FunctionType) {
        return unEither(
            typeToString,
            {
                imports: [],
                result: "Error",
            },
            (unEither) => {
                return config.generateFunctionType(type, (f) => {
                    return unEither(f, config, getReferenceTo);
                });
            }
        );
    }

    if (type instanceof ObjectType) {
        const ref = getReferenceTo(type);
        return right({
            result: ref.name,
            imports: [],
        });
    }

    if (type instanceof ArrayType) {
        return unEither(
            typeToString,
            {
                imports: [],
                result: "Error",
            },
            (unEithered) =>
                config.generateArrayType(type, (f) =>
                    unEithered(f, config, getReferenceTo)
                )
        );
    }

    if (type instanceof UnionType) {
        if (type.type.length === 0) {
            return left(new Error("Empty union type"));
        }

        if (type.type.length > 2) {
            return left(new Error("Union has more then 2 options"));
        }

        const voidIndex = type.type.findIndex((item) => {
            if (item instanceof PrimitiveType && item.type === "VOID") {
                return true;
            }
            return false;
        });

        if (voidIndex === -1)
            return left(
                new Error("Union has 2 options and no one is VOID type")
            );

        const valIndex = 1 - voidIndex;

        return typeToString(type.type[valIndex], config, getReferenceTo);
    }

    if (type instanceof ReferenceType) {
        const ref = config.nativeReferencesMap[type.type.typeName];

        if (!ref)
            return left(
                new Error(`Unknown native reference to "${type.type.typeName}"`)
            );

        const generics = pipe(
            sequenceEither(
                type.type.genericArgs.map((t) =>
                    typeToString(t, config, getReferenceTo)
                )
            ),
            map((results) => {
                const args: string[] = [];
                const genericImports = new Set([ref.import]);
                for (const tts of results) {
                    args.push(tts.result);
                    for (const imprt of tts.imports) {
                        genericImports.add(imprt);
                    }
                }
                return {
                    imports: Array.from(genericImports),
                    result:
                        ref.text +
                        (args.length === 0 ? "" : `<${args.join(", ")}>`),
                };
            }),
            mapLeft((errors) => {
                return new ReferenceTypeGenericError(
                    type.type.typeName,
                    errors,
                    type
                );
            })
        );

        return generics;
    }
    if (type instanceof UserType) {
        return right({
            imports: type.type.imports,
            result: type.type.text,
        });
    }

    return left(new Error(`Unkown type: ${JSON.stringify(type)}`));
};
