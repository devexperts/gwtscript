import { right } from "fp-ts/lib/Either";

import { PrimitiveType } from "../../model";
import { generateContent } from "../generateContent";
import { GeneratorConfig } from "../generator.config";

describe("generateContent()", () => {
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
            generateContent(
                {
                    name: "AA",
                    fields: [
                        { name: "a", type: new PrimitiveType("NUMBER") },
                        { name: "b", type: new PrimitiveType("STRING") },
                    ],
                    sourcePath: "/asd/asd/AA.java",
                },
                "a.a",
                (name) => ({
                    import: "aa.aa." + name,
                    name: `AA_${name}`,
                })
            )(config)
        ).toEqual(
            right(`package a.a;

import jsinterop.annotations.JsPackage;
import jsinterop.annotations.JsType;
import gwt.react.client.proptypes.BaseProps;
import com.test.pk.int;
import com.test.pk.str;


@JsType(isNative = true, namespace = JsPackage.GLOBAL, name = "Object")
public class AA extends BaseProps {
    public int a;
    public str b;
}
`)
        );
    });
});
