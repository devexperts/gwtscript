import { map, none, some } from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { UserType } from "../../model";
import { unifyTypeOrInterface } from "../unifyTypeOrInterface";
import { testConfig } from "./test.config";
import { ifc, TAKE, td, TestHost } from "./TestHost";

describe("unifyTypeOrInterface()", () => {
    const host = new TestHost({
        declarations: {
            inf: ifc`
                interface Inf {
                    a: number;
                    // @Ignore
                    b: string;
                    c(a: string): number
                }
            `,
            typeDeclaration: td`
                type TD = {
                    // @Ignore
                    a: number;
                    b: string;
                    c: (a: string) => number
                }
            `,
            oddDeclaration: td`
                type Mapper<T extends { [key: string]; any }> = { map: string } & {
                    [K in keyof T]: T[K]
                }

                type Pick<T, K extends keyof T> = {
                    [P in K]: T[P];
                };

                ${TAKE}type Odd = Pick<
                    Mapper<{
                        a: string
                        b: number
                        c: boolean
                    }>,
                    'a' | 'map'
                >
            `,
            reversed: td`
                const B = {
                    a: 22,
                    b: "ASDASD"
                }

                ${TAKE}type Reve = typeof B; 
            `,
            inJavaTest: ifc`
                interface InJava {
                    // @InJava JsNumber from com.js.JsNumber
                    a: number
                    b: string
                }
            `,
            errWithLiteral: td`type A = number`,
        },
    });

    describe.each([
        [
            host.getNode("inf"),
            some({
                name: "Inf",
                fields: ["a", "c"],
            }),
        ],
        [
            host.getNode("typeDeclaration"),
            some({
                name: "TD",
                fields: ["b", "c"],
            }),
        ],
        [
            host.getNode("oddDeclaration"),
            some({
                name: "Odd",
                fields: ["a", "map"],
            }),
        ],
        [
            host.getNode("reversed"),
            some({
                name: "Reve",
                fields: ["a", "b"],
            }),
        ],
        [host.getNode("errWithLiteral"), none],
    ])("table tests", (inter, result) => {
        it("works in common cases", () => {
            expect(
                pipe(
                    unifyTypeOrInterface(
                        inter,
                        host.checker.getTypeAtLocation(inter),
                        testConfig,
                        "test/aa.ts",
                        host.checker
                    ),
                    map((item) => ({
                        name: item.name,
                        fields: item.fields.map((f) => f.name),
                    }))
                )
            ).toEqual(result);
        });
    });

    it("works with @InJava", () => {
        expect(
            pipe(
                unifyTypeOrInterface(
                    host.getNode("inJavaTest"),
                    host.checker.getTypeAtLocation(host.getNode("inJavaTest")),
                    testConfig,
                    "test/aa.ts",
                    host.checker
                ),
                map((item) => ({
                    name: item.name,
                    fields: item.fields.map((f) => ({
                        name: f.name,
                        userInput: f.userInput,
                    })),
                }))
            )
        ).toEqual(
            some({
                name: "InJava",
                fields: [
                    {
                        name: "a",
                        userInput: new UserType({
                            text: "JsNumber",
                            imports: ["com.js.JsNumber"],
                        }),
                    },
                    { name: "b" },
                ],
            })
        );
    });
});
