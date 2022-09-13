import { right } from "fp-ts/lib/Either";

import { ObjectType, PrimitiveType } from "../../model";
import { generateExtraType } from "../generateExtraType";
import { GeneratorConfig } from "../generator.config";

describe("generateExtraType()", () => {
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
    it("works in common cases", () => {
        expect(
            generateExtraType(
                "Test",
                "a.a",
                new ObjectType([
                    { name: "a", type: new PrimitiveType("NUMBER") },
                    { name: "b", type: new PrimitiveType("STRING") },
                ]),
                config,
                () => ({ name: "", import: "" })
            )
        ).toEqual(
            right(
                `package a.a;

import jsinterop.annotations.JsPackage;
import jsinterop.annotations.JsType;
import com.test.pk.int;
import com.test.pk.str;

@JsType(isNative = true, namespace = JsPackage.GLOBAL, name = "Object")
public class Test {
    public int a;
    public str b;
}
`
            )
        );
    });
});
