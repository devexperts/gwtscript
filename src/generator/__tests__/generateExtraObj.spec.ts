import { Either, left, right } from "fp-ts/lib/Either";
import { ObjectType, PrimitiveType, UnionType } from "../../model";
import { generateExtraObj } from "../generateExtraObj";

import { GeneratorConfig } from "../generator.config";
import { ExtraObject } from "../model";

describe("generateExtraObj()", () => {
    const config: GeneratorConfig = {
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
    it("works", () => {
        expect(
            generateExtraObj(
                "test",
                "test",
                "test",
                new ObjectType([
                    { name: "a", type: new PrimitiveType("NUMBER") },
                ]),
                config,
                () => ({
                    import: "",
                    name: "",
                })
            )
        ).toEqual<Either<any, ExtraObject>>(
            right({
                content: `package test;

import com.test.pk.int;


public class test {
    public int a;
}
`,
                name: "test",
                path: "test",
                type: new ObjectType([
                    { name: "a", type: new PrimitiveType("NUMBER") },
                ]),
            })
        );
    });

    it("takes left", () => {
        expect(
            generateExtraObj(
                "test",
                "test",
                "test",
                new ObjectType([{ name: "a", type: new UnionType([]) }]),
                config,
                () => ({
                    import: "",
                    name: "",
                })
            )
        ).toEqual(left(expect.anything()));
    });
});
