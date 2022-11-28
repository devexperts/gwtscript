import * as Either from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import {
    defaultInterfacePredicate,
    defaultFieldPredicate,
} from "@root/utils/defaultPredicates";

import { getFields, NotAnObjectException } from "../getFields";
import { ParserConfig } from "../parser.model";
import { ifc, TAKE, td, TestHost } from "./TestHost";

describe("getFields()", () => {
    const testConfig: ParserConfig = {
        inJavaRegExpTest: /@InJava/,
        interfacePredicate: defaultInterfacePredicate(/@ToJava/),
        nativeReferences: [],
        tsconfigAbsolutePath: "",
        ignoreField: defaultFieldPredicate(/@Ignore/),
    };
    const host = new TestHost({
        declarations: {
            normalType: td`
                type NormalType = {
                    a: number;
                    // @Ignore
                    b: number;
                    c: () => void;
                    d(): void
                }
            `,
            normalInterface: ifc`
                interface NormalInterface {
                    a: number;
                    // @Ignore
                    b: number;
                }
            `,
            typeConcatenation: td`
                type A = {
                    a: number;
                    // @Ignore
                    c: number;
                }
                ${TAKE}type TypeConcatenation = A & {
                    b: number
                    // @Ignore
                    d: number;
                }
            `,
            extendedInterface: ifc`
                interface A {
                    a: number;
                    // @Ignore
                    c: number
                }
                ${TAKE}interface ExtendedInterface extends A {
                    b: number
                    // @Ignore
                    d: number
                }
            `,
            typeofObject: td`
                const a = {
                    a: 2,
                    b(){
                        return 4;
                    },
                    c: (a: number) => a,
                    // @Ignore
                    d: "ASD",
                }

                ${TAKE}type A = typeof a;
            `,
            mappedType: td`
                type Pick<T, K extends keyof T> = {
                    [P in K]: T[P];
                };

                type S = {
                    a: number;
                    b: number;
                }

                ${TAKE}type B = Pick<S, "a">
            `,
            emptyType: td`
                type EmptyType = {}
            `,
            emptyIgnoredType: td`
                type EmptyIgnoredType = {
                    // @Ignore
                    a: number
                }
            `,
            emptyIgnoredConcatenatedType: td`
                export type B = {

                }
                export type C = {
                    // @Ignore
                    b: number
                }
                ${TAKE}type EmptyIgnoredConcatenatedType = B & C & {
                    // @Ignore
                    a: number
                }
            `,
            emptyInterface: ifc`
                interface EmptyInterface {

                }
            `,
            emptyIgnoredInterface: ifc`
                interface EmptyIgnoredInterface {
                    // @Ignore
                    a: number;
                }
            `,
            emptyIgnoredExtendedInterface: ifc`
                interface B {
                    // @Ignore
                    b: number
                }
                ${TAKE}interface EmptyIgnoredExtendedInterface extends B {
                    // @Ignore
                    a: number;
                }
            `,
            notObjectType: td`
                type NotObjectType = number;
            `,
            notObjectTypeConcatenation: td`
                type NotObjectTypeConcatenation = number & {
                    a: number
                }
            `,
            userInputType: td`
                type UserInputType = {
                    // @InJava
                    a: number
                }
            `,
        },
    });

    type Keys = Parameters<typeof host["getNode"]>[0];

    it.each<[Keys, string[]]>([
        ["normalType", ["a", "c", "d"]],
        ["normalInterface", ["a"]],
        ["typeConcatenation", ["a", "b"]],
        ["extendedInterface", ["b", "a"]],
        ["typeofObject", ["a", "b", "c"]],
        ["mappedType", ["a"]],
        ["emptyType", []],
        ["emptyIgnoredType", []],
        ["emptyIgnoredConcatenatedType", []],
        ["emptyInterface", []],
        ["emptyIgnoredInterface", []],
        ["emptyIgnoredExtendedInterface", []],
    ])("getFields(%s): %p", (key, result) => {
        const statement = host.getNode(key);

        const fields = getFields(host.checker, () => () =>
            Either.left(new Error("error"))
        )(host.checker.getTypeAtLocation(statement));

        expect(
            pipe(
                testConfig,
                fields,
                Either.map((fields) => fields.map((field) => field.name))
            )
        ).toEqual(Either.right(result));
    });

    it.each<[Keys]>([["notObjectType"], ["notObjectTypeConcatenation"]])(
        "getFields(%s): NotAnObjectException",
        (key) => {
            const statement = host.getNode(key);
            const fields = getFields(host.checker, () => () =>
                Either.left(new Error("error"))
            )(host.checker.getTypeAtLocation(statement))(testConfig);

            expect(fields).toEqual(Either.left(new NotAnObjectException()));
        }
    );

    it("handles user input type", () => {
        const statement = host.getNode("userInputType");
        const fields = getFields(host.checker, () => () =>
            Either.right({
                identifier: "hard-coded-type",
                type: {
                    imports: ["imports"],
                    text: "kek",
                },
            })
        )(host.checker.getTypeAtLocation(statement))(testConfig);

        expect(fields).toEqual(
            Either.right([
                {
                    name: "a",
                    node: expect.anything(),
                    userInput: {
                        identifier: "hard-coded-type",
                        type: {
                            imports: ["imports"],
                            text: "kek",
                        },
                    },
                },
            ])
        );
    });
});
