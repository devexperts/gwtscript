import { left, right } from "fp-ts/lib/Either";
import {
    ObjectType,
    ParsedType,
    PrimitiveType,
    ReferenceType,
    UnionType,
} from "../../model";
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
        nativeReferencesMap: {},
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
        typeToString(type, config, () => ({
            import: "",
            name: "",
        }));

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
            left(
                new Error("Cannot stringify VOID when it's not a function type")
            )
        );
    });

    it("works with unions", () => {
        expect(
            typeToString(
                new UnionType([
                    new PrimitiveType("VOID"),
                    new PrimitiveType("NUMBER"),
                ]),
                config,
                () => ({
                    import: "",
                    name: "",
                })
            )
        ).toEqual(right(config.primitiveMapping.NUMBER));

        expect(
            typeToString(new UnionType([]), config, () => ({
                import: "",
                name: "",
            }))
        ).toEqual(left(new Error("Empty union type")));

        expect(
            typeToString(
                new UnionType([
                    new PrimitiveType("VOID"),
                    new PrimitiveType("NUMBER"),
                    new PrimitiveType("STRING"),
                ]),
                config,
                () => ({
                    import: "",
                    name: "",
                })
            )
        ).toEqual(
            left(
                new Error(
                    `Cannot stringify union, ${JSON.stringify(
                        new UnionType([
                            new PrimitiveType("VOID"),
                            new PrimitiveType("NUMBER"),
                            new PrimitiveType("STRING"),
                        ]),
                        undefined,
                        2
                    )}`
                )
            )
        );

        expect(
            typeToString(
                new UnionType([
                    new PrimitiveType("NUMBER"),
                    new PrimitiveType("STRING"),
                ]),
                config,
                () => ({
                    import: "",
                    name: "",
                })
            )
        ).toEqual(
            left(
                new Error(
                    `Cannot stringify union, ${JSON.stringify(
                        new UnionType([
                            new PrimitiveType("NUMBER"),
                            new PrimitiveType("STRING"),
                        ]),
                        undefined,
                        2
                    )}`
                )
            )
        );
    });

    it("works with refs", () => {
        expect(
            typeToString(
                new ReferenceType({
                    typeName: "Refa",
                    genericArgs: [],
                }),
                config,
                () => ({ import: "", name: "" })
            )
        ).toEqual(left(new Error('Unknown native reference to "Refa"')));

        expect(
            typeToString(
                new ReferenceType({
                    typeName: "Refa",
                    genericArgs: [new PrimitiveType("STRING")],
                }),
                {
                    ...config,
                    nativeReferencesMap: {
                        Refa: {
                            import: "com.a.s",
                            text: "Refa1",
                        },
                    },
                },
                () => ({ import: "", name: "" })
            )
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
                config,
                () => ({
                    import: "com.test.import.obj_A",
                    name: "obj_A",
                })
            )
        ).toEqual(
            right({
                result: "obj_A",
                imports: [],
            })
        );
    });
});
