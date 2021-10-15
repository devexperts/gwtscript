import { none, some } from "fp-ts/lib/Option";
import {
    ArrayType,
    FunctionType,
    NumberLiteral,
    ObjectType,
    PrimitiveType,
    ReferenceType,
    StringLiteral,
    UnionType,
} from "../../model";
import { parseTypeNode } from "../parseTypeNode";
import { testConfig } from "./test.config";
import { TAKE, td, TestHost } from "./TestHost";

describe("parseTypeNode()", () => {
    const host = new TestHost({
        declarations: {
            num: td`type A = number`,
            str: td`type A = string`,
            bool: td`type A = boolean`,
            func: td`type A = (c: number, b: string) => string`,
            obj: td`type A = { a: number, b: string, c: (j: number) => string }`,
            union: td`type A = number | string`,
            ins: td`
                interface B {
                    d: string;
                }
                ${TAKE}type A = { a: number } & { c: number } & B;
            `,
            pick: td`
                type Pick<T, K extends keyof T> = {
                    [P in K]: T[P];
                }

                ${TAKE}type A = Pick<{ a: number, b: string }, 'a'>;
            `,
            primitiveArray: td`type A = number[]`,
            objectArray: td`type A = { a: number }[]`,
            literalError: td`type A = true | 2 | "ASDASD"`,
            empyArrayError: td`type A = []`,
            strLiteral: td`type A = "AA"`,
            numLiteral: td`type A = 4`,
        },
    });

    describe.each([
        [host.getNode("num"), some(new PrimitiveType("NUMBER"))],
        [host.getNode("str"), some(new PrimitiveType("STRING"))],
        [host.getNode("bool"), some(new PrimitiveType("BOOLEAN"))],
        [
            host.getNode("func"),
            some(
                new FunctionType(new PrimitiveType("STRING"), [
                    new PrimitiveType("NUMBER"),
                    new PrimitiveType("STRING"),
                ])
            ),
        ],
        [
            host.getNode("obj"),
            some(
                new ObjectType([
                    { name: "a", type: new PrimitiveType("NUMBER") },
                    { name: "b", type: new PrimitiveType("STRING") },
                    {
                        name: "c",
                        type: new FunctionType(new PrimitiveType("STRING"), [
                            new PrimitiveType("NUMBER"),
                        ]),
                    },
                ])
            ),
        ],
        [
            host.getNode("union"),
            some(
                new UnionType([
                    new PrimitiveType("NUMBER"),
                    new PrimitiveType("STRING"),
                ])
            ),
        ],
        [
            host.getNode("ins"),
            some(
                new ObjectType([
                    { name: "a", type: new PrimitiveType("NUMBER") },
                    { name: "c", type: new PrimitiveType("NUMBER") },
                    { name: "d", type: new PrimitiveType("STRING") },
                ])
            ),
        ],
        [
            host.getNode("pick"),
            some(
                new ObjectType([
                    { name: "a", type: new PrimitiveType("NUMBER") },
                ])
            ),
        ],
        [
            host.getNode("primitiveArray"),
            some(new ArrayType(new PrimitiveType("NUMBER"))),
        ],
        [
            host.getNode("objectArray"),
            some(
                new ArrayType(
                    new ObjectType([
                        { name: "a", type: new PrimitiveType("NUMBER") },
                    ])
                )
            ),
        ],
        [host.getNode("empyArrayError"), none],
        [host.getNode("literalError"), none],
        [host.getNode("strLiteral"), some(new StringLiteral("AA"))],
        [host.getNode("numLiteral"), some(new NumberLiteral(4))],
    ])("table tests", (arg, result) => {
        test("correct type detection", () => {
            expect(
                parseTypeNode(
                    arg.type,
                    host.checker,
                    host.checker.getTypeAtLocation(arg.type),
                    testConfig
                )
            ).toEqual(result);
        });
    });

    it("works with references", () => {
        const refHost = new TestHost({
            declarations: {
                refs: td`
                    class Observable<T> {
                        public a: T
                    }

                    class Event {

                    }

                    ${TAKE}type A = {
                        a: Observable<Event>
                    }
                `,
            },
        });

        expect(
            parseTypeNode(
                refHost.getNode("refs").type,
                refHost.checker,
                refHost.checker.getTypeAtLocation(refHost.getNode("refs").type),
                {
                    ...testConfig,
                    nativeReferences: ["Observable", "Event"],
                }
            )
        ).toEqual(
            some(
                new ObjectType([
                    {
                        name: "a",
                        type: new ReferenceType({
                            typeName: "Observable",
                            genericArgs: [
                                new ReferenceType({
                                    typeName: "Event",
                                    genericArgs: [],
                                }),
                            ],
                        }),
                    },
                ])
            )
        );
    });
});
