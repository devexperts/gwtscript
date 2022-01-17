import { left, right } from "fp-ts/lib/Either";

import {
    ObjectType,
    ParsedType,
    PrimitiveType,
    ReferenceType,
    UnionType,
} from "../../model";
import {
    CannotGenerateEmptyUnionTypeError,
    CannotGenerateUnionError,
    CannotStringifyVoidError,
} from "../generator.errors";
import { typeToString } from "../typeToString";

describe("typeToString()", () => {
    const config = {
        destinationFolder: "",
        generateArrayType: () => ({
            imports: [],
            result: "",
        }),
        generateFunctionType: () => ({
            imports: [],
            result: "",
        }),
        nativeReferencesMap: {
            Refa: {
                text: "Refa1",
                import: "com.a.s",
            },
        },
        rootPackage: "",
        primitiveMapping: {
            ANY: {
                imports: [],
                result: "Object",
            },
            BOOLEAN: {
                imports: ["bool"],
                result: "com.test.pkj.bool",
            },
            NUMBER: {
                imports: ["com.test.pk.int"],
                result: "int",
            },
            STRING: {
                imports: ["com.test.pk.str"],
                result: "str",
            },
            VOID: {
                imports: ["com.test.pk.vd"],
                result: "vd",
            },
        },
    };

    const testFunc = (type: ParsedType) =>
        typeToString(type, () => ({
            import: "",
            name: "",
        }))(config);

    it("works with primitives", () => {
        expect(testFunc(new PrimitiveType("NUMBER"))).toEqual(
            right(config.primitiveMapping.NUMBER)
        );

        expect(testFunc(new PrimitiveType("STRING"))).toEqual(
            right(config.primitiveMapping.STRING)
        );

        expect(testFunc(new PrimitiveType("BOOLEAN"))).toEqual(
            right(config.primitiveMapping.BOOLEAN)
        );

        expect(testFunc(new PrimitiveType("ANY"))).toEqual(
            right(config.primitiveMapping.ANY)
        );

        expect(testFunc(new PrimitiveType("VOID"))).toEqual(
            left(new CannotStringifyVoidError())
        );
    });

    it("works with unions", () => {
        expect(
            typeToString(
                new UnionType([
                    new PrimitiveType("VOID"),
                    new PrimitiveType("NUMBER"),
                ]),
                () => ({
                    import: "",
                    name: "",
                })
            )(config)
        ).toEqual(right(config.primitiveMapping.NUMBER));

        expect(
            typeToString(new UnionType([]), () => ({
                import: "",
                name: "",
            }))(config)
        ).toEqual(left(new CannotGenerateEmptyUnionTypeError()));

        expect(
            typeToString(
                new UnionType([
                    new PrimitiveType("VOID"),
                    new PrimitiveType("NUMBER"),
                    new PrimitiveType("STRING"),
                ]),
                () => ({
                    import: "",
                    name: "",
                })
            )(config)
        ).toEqual(left(new CannotGenerateUnionError()));

        expect(
            typeToString(
                new UnionType([
                    new PrimitiveType("NUMBER"),
                    new PrimitiveType("STRING"),
                ]),
                () => ({
                    import: "",
                    name: "",
                })
            )(config)
        ).toEqual(left(new CannotGenerateUnionError()));
    });

    it("works with refs", () => {
        expect(
            typeToString(
                new ReferenceType({
                    typeName: "Refa1",
                    genericArgs: [],
                }),
                () => ({ import: "", name: "" })
            )(config)
        ).toEqual(left(new Error('Unknown native reference to "Refa1"')));

        expect(
            typeToString(
                new ReferenceType({
                    typeName: "Refa",
                    genericArgs: [new PrimitiveType("STRING")],
                }),
                () => ({ import: "", name: "" })
            )(config)
        ).toEqual(
            right({
                result: "Refa1<str>",
                imports: ["com.a.s", "com.test.pk.str"],
            })
        );
    });

    it("works with objects", () => {
        expect(
            typeToString(
                new ObjectType([
                    { name: "a", type: new PrimitiveType("NUMBER") },
                    { name: "b", type: new PrimitiveType("STRING") },
                ]),
                () => ({
                    import: "com.test.import.obj_A",
                    name: "obj_A",
                })
            )(config)
        ).toEqual(
            right({
                result: "obj_A",
                imports: [],
            })
        );
    });
});
