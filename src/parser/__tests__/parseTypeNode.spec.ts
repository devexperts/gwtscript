import { left, right } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

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
import {
    CannotParseTypeError,
    CannotParseTypeNodeError,
    FailedToParseUnionError,
} from "../parser.errors";
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
        [host.getNode("num"), right(new PrimitiveType("NUMBER"))],
        [host.getNode("str"), right(new PrimitiveType("STRING"))],
        [host.getNode("bool"), right(new PrimitiveType("BOOLEAN"))],
        [
            host.getNode("func"),
            right(
                new FunctionType(new PrimitiveType("STRING"), [
                    { name: "c", type: new PrimitiveType("NUMBER") },
                    { name: "b", type: new PrimitiveType("STRING") },
                ])
            ),
        ],
        [
            host.getNode("obj"),
            right(
                new ObjectType([
                    { name: "a", type: new PrimitiveType("NUMBER") },
                    { name: "b", type: new PrimitiveType("STRING") },
                    {
                        name: "c",
                        type: new FunctionType(new PrimitiveType("STRING"), [
                            { name: "j", type: new PrimitiveType("NUMBER") },
                        ]),
                    },
                ])
            ),
        ],
        [
            host.getNode("union"),
            right(
                new UnionType([
                    new PrimitiveType("NUMBER"),
                    new PrimitiveType("STRING"),
                ])
            ),
        ],
        [
            host.getNode("ins"),
            right(
                new ObjectType([
                    { name: "a", type: new PrimitiveType("NUMBER") },
                    { name: "c", type: new PrimitiveType("NUMBER") },
                    { name: "d", type: new PrimitiveType("STRING") },
                ])
            ),
        ],
        [
            host.getNode("pick"),
            right(
                new ObjectType([
                    { name: "a", type: new PrimitiveType("NUMBER") },
                ])
            ),
        ],
        [
            host.getNode("primitiveArray"),
            right(new ArrayType(new PrimitiveType("NUMBER"))),
        ],
        [
            host.getNode("objectArray"),
            right(
                new ArrayType(
                    new ObjectType([
                        { name: "a", type: new PrimitiveType("NUMBER") },
                    ])
                )
            ),
        ],
        [
            host.getNode("empyArrayError"),
            left(new CannotParseTypeNodeError("", "", "", null)),
        ],
        [
            host.getNode("literalError"),
            left(
                new FailedToParseUnionError("", "", "", [
                    new CannotParseTypeError("", "", "", null),
                ])
            ),
        ],
        [host.getNode("strLiteral"), right(new StringLiteral("AA"))],
        [host.getNode("numLiteral"), right(new NumberLiteral(4))],
    ])("table tests", (arg, result) => {
        test("correct type detection", () => {
            expect(
                pipe(
                    testConfig,
                    parseTypeNode(
                        arg.type,
                        host.checker,
                        host.checker.getTypeAtLocation(arg.type),
                        { fieldName: "", location: "", typeName: "" }
                    )
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
            pipe(
                {
                    ...testConfig,
                    nativeReferences: ["Observable", "Event"],
                },
                parseTypeNode(
                    refHost.getNode("refs").type,
                    refHost.checker,
                    refHost.checker.getTypeAtLocation(
                        refHost.getNode("refs").type
                    ),
                    { fieldName: "", location: "", typeName: "" }
                )
            )
        ).toEqual(
            right(
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
