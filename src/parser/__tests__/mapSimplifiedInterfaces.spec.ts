import { pipe } from "fp-ts/lib/pipeable";

import { chainW, map } from "fp-ts/lib/ReaderEither";
import { right } from "fp-ts/lib/Either";

import { mapSimplifiedInterfaces } from "../mapSimplifiedInterfaces";
import { ifc, TAKE, TestHost } from "./TestHost";
import { unifyTypeOrInterface } from "../unifyTypeOrInterface";
import { testConfig } from "./test.config";
import { FunctionType, ObjectType, PrimitiveType } from "../../model";
describe("mapSimplifiedInterfaces()", () => {
    const host = new TestHost({
        declarations: {
            interf: ifc`

                type B = {
                    v: number
                }

                ${TAKE}interface A {
                    a: number
                    b: string
                    c(a: number): B
                }
            `,
            overrides: ifc`
                interface Overrides {
                    name: string
                }
            `,
        },
    });

    it("works", () => {
        expect(
            pipe(
                unifyTypeOrInterface(
                    host.getNode("interf"),
                    host.checker.getTypeAtLocation(host.getNode("interf")),
                    "",
                    host.checker
                ),
                chainW((item) => mapSimplifiedInterfaces([item], host.checker)),
                map((items) => items[0])
            )(testConfig)
        ).toEqual(
            right({
                name: "A",
                sourcePath: "",
                fields: [
                    { name: "a", type: new PrimitiveType("NUMBER") },
                    { name: "b", type: new PrimitiveType("STRING") },
                    {
                        name: "c",
                        type: new FunctionType(
                            new ObjectType([
                                {
                                    name: "v",
                                    type: new PrimitiveType("NUMBER"),
                                },
                            ]),
                            [{ name: "a", type: new PrimitiveType("NUMBER") }]
                        ),
                    },
                ],
                overrides: null,
            })
        );
    });

    it("handles overrides", () => {
        expect(
            pipe(
                unifyTypeOrInterface(
                    host.getNode("overrides"),
                    host.checker.getTypeAtLocation(host.getNode("overrides")),
                    "",
                    host.checker
                ),
                chainW((item) => mapSimplifiedInterfaces([item], host.checker)),
                map((items) => items[0])
            )(testConfig)
        ).toEqual(
            right({
                name: "Overrides",
                sourcePath: "",
                fields: [{ name: "name", type: new PrimitiveType("STRING") }],
                overrides: null,
            })
        );
    });
});
