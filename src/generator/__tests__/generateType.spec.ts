import { right } from "fp-ts/lib/Either";
import {
    ArrayType,
    FunctionType,
    NumberLiteral,
    ObjectType,
    PrimitiveType,
    ReferenceType,
    StringLiteral,
    UnionType,
    UserType,
} from "../../model";
import { generateType } from "../generateType";
import { GeneratorConfig } from "../generator.config";

describe("generateType()", () => {
    const config: GeneratorConfig = {
        destinationFolder: "/dist/",
        generateArrayType: (arr, stringify) => {
            const { imports, result } = stringify(arr.type);

            return {
                imports: ["com.js.JsArray", ...imports],
                result: `JsArray<${result}>`,
            };
        },
        generateFunctionType: (func, stringify) => {
            const { result, imports: resImports } = stringify(func.type);

            const other = func.parameters
                .map((item) => stringify(item))
                .reduce<{ types: string[]; imports: string[] }>(
                    (prev, cur) => {
                        return {
                            types: prev.types.concat(cur.result),
                            imports: prev.imports.concat(cur.imports),
                        };
                    },
                    {
                        types: [],
                        imports: [],
                    }
                );

            return {
                imports: ["com.js.JsFunc", ...resImports, ...other.imports],
                result: `JsFunc<${other.types.join(", ")}, ${result}>`,
            };
        },
        nativeReferencesMap: {
            Observable: {
                import: "com.rx.Observable",
                text: "Observable",
            },
            Event: {
                import: "com.js.Event",
                text: "Event",
            },
        },
        rootPackage: "com.devexperts",
        primitiveMapping: {
            ANY: {
                imports: [],
                result: "Object",
            },
            BOOLEAN: {
                imports: ["com.test.pkj.bool"],
                result: "bool",
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
            generateType(
                {
                    name: "Test",
                    fields: [
                        {
                            name: "objField",
                            type: new ObjectType([
                                {
                                    name: "a",
                                    type: new PrimitiveType("NUMBER"),
                                },
                                {
                                    name: "b",
                                    type: new PrimitiveType("STRING"),
                                },
                            ]),
                        },
                        {
                            name: "numField",
                            type: new PrimitiveType("NUMBER"),
                        },
                        {
                            name: "array",
                            type: new ArrayType(new PrimitiveType("BOOLEAN")),
                        },
                        {
                            name: "calcSum",
                            type: new FunctionType(
                                new PrimitiveType("NUMBER"),
                                [
                                    new PrimitiveType("NUMBER"),
                                    new PrimitiveType("NUMBER"),
                                ]
                            ),
                        },
                        {
                            name: "refable",
                            type: new ReferenceType({
                                typeName: "Observable",
                                genericArgs: [
                                    new ObjectType([
                                        {
                                            name: "event",
                                            type: new ReferenceType({
                                                genericArgs: [],
                                                typeName: "Event",
                                            }),
                                        },
                                    ]),
                                ],
                            }),
                        },
                        {
                            name: "userTest",
                            type: new UserType({
                                text: "Observable<Event>",
                                imports: ["com.rx.Observable", "com.js.Event"],
                            }),
                        },
                        {
                            name: "stringUnionNullable",
                            type: new UnionType([
                                new StringLiteral("option1"),
                                new StringLiteral("option2"),
                                new PrimitiveType("VOID"),
                            ]),
                        },
                        {
                            name: "stringUnion",
                            type: new UnionType([
                                new StringLiteral("option1"),
                                new StringLiteral("option2"),
                            ]),
                        },
                        {
                            name: "numberUnion",
                            type: new UnionType([
                                new NumberLiteral(1),
                                new NumberLiteral(2),
                            ]),
                        },
                        {
                            name: "numberUnionNullable",
                            type: new UnionType([
                                new NumberLiteral(1),
                                new NumberLiteral(2),
                                new PrimitiveType("VOID"),
                            ]),
                        },
                    ],
                    sourcePath: "asd/asdss/aaa/test.ts",
                },
                config
            )
        ).toEqual(
            right([
                {
                    name: "Test",
                    path: "/dist/test/Test.java",
                    content: `package com.devexperts.test;

import jsinterop.annotations.JsPackage;
import jsinterop.annotations.JsType;
import gwt.react.client.proptypes.BaseProps;
import com.test.pk.int;
import com.js.JsArray;
import com.test.pkj.bool;
import com.js.JsFunc;
import com.rx.Observable;
import com.js.Event;


@JsType(isNative = true, namespace = JsPackage.GLOBAL, name = "Object")
public class Test extends BaseProps {
    public Test_objField objField;
    public int numField;
    public JsArray<bool> array;
    public JsFunc<int, int, int> calcSum;
    public Observable<Test_refable> refable;
    public Observable<Event> userTest;
    public Test_stringUnionNullable stringUnionNullable;
    public Test_stringUnion stringUnion;
    public Test_numberUnion numberUnion;
    public Test_numberUnionNullable numberUnionNullable;
}
`,
                },
                {
                    name: "Test_objField",
                    path: "/dist/test/Test_objField.java",
                    content: `package com.devexperts.test;

import com.test.pk.int;
import com.test.pk.str;


public class Test_objField {
    public int a;
    public str b;
}
`,
                },
                {
                    name: "Test_refable",
                    path: "/dist/test/Test_refable.java",
                    content: `package com.devexperts.test;

import com.js.Event;


public class Test_refable {
    public Event event;
}
`,
                },
                {
                    name: "Test_stringUnionNullable",
                    path: "/dist/test/Test_stringUnionNullable.java",
                    content: `package com.devexperts.test;

import static com.devexperts.client.reusable.core.JsNativesUtils.jsEnum;
import com.devexperts.client.reusable.core.JsEnum;

public interface Test_stringUnionNullable extends JsEnum {
    Test_stringUnionNullable OPTION1 = jsEnum("option1", Test_stringUnionNullable.class);
    Test_stringUnionNullable OPTION2 = jsEnum("option2", Test_stringUnionNullable.class);
}
`,
                },
                {
                    name: "Test_stringUnion",
                    path: "/dist/test/Test_stringUnion.java",
                    content: `package com.devexperts.test;

import static com.devexperts.client.reusable.core.JsNativesUtils.jsEnum;
import com.devexperts.client.reusable.core.JsEnum;

public interface Test_stringUnion extends JsEnum {
    Test_stringUnion OPTION1 = jsEnum("option1", Test_stringUnion.class);
    Test_stringUnion OPTION2 = jsEnum("option2", Test_stringUnion.class);
}
`,
                },
                {
                    name: "Test_numberUnion",
                    path: "/dist/test/Test_numberUnion.java",
                    content: `package com.devexperts.test;

import static com.devexperts.client.reusable.core.JsNativesUtils.jsEnum;
import com.devexperts.client.reusable.core.JsEnum;

public interface Test_numberUnion extends JsEnum {
    Test_numberUnion TEST_NUMBERUNION_1 = jsEnum(1, Test_numberUnion.class);
    Test_numberUnion TEST_NUMBERUNION_2 = jsEnum(2, Test_numberUnion.class);
}
`,
                },
                {
                    name: "Test_numberUnionNullable",
                    path: "/dist/test/Test_numberUnionNullable.java",
                    content: `package com.devexperts.test;

import static com.devexperts.client.reusable.core.JsNativesUtils.jsEnum;
import com.devexperts.client.reusable.core.JsEnum;

public interface Test_numberUnionNullable extends JsEnum {
    Test_numberUnionNullable TEST_NUMBERUNIONNULLABLE_1 = jsEnum(1, Test_numberUnionNullable.class);
    Test_numberUnionNullable TEST_NUMBERUNIONNULLABLE_2 = jsEnum(2, Test_numberUnionNullable.class);
}
`,
                },
            ])
        );
    });
});
