import { mapSimplifiedInterfaces } from "../mapSimplifiedInterfaces";
import { ifc, TAKE, TestHost } from "./TestHost";
import { unifyTypeOrInterface } from "../unifyTypeOrInterface";
import { pipe } from "fp-ts/lib/pipeable";
import { testConfig } from "./test.config";
import { chain, map, Option, some } from "fp-ts/lib/Option";
import {
    FunctionType,
    ObjectType,
    PrimitiveType,
    TypeToGenerate,
} from "../../model";
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
        },
    });

    it("works", () => {
        expect(
            pipe(
                unifyTypeOrInterface(
                    host.getNode("interf"),
                    host.checker.getTypeAtLocation(host.getNode("interf")),
                    testConfig,
                    "",
                    host.checker
                ),
                chain((item) =>
                    mapSimplifiedInterfaces([item], host.checker, testConfig)
                ),
                map((items) => items[0])
            )
        ).toEqual<Option<TypeToGenerate>>(
            some({
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
                            [new PrimitiveType("NUMBER")]
                        ),
                    },
                ],
            })
        );
    });
});
