import { defaultInterfacePredicate } from "@root/utils/defaultPredicates";

import { getNodes } from "../getNodes";

import { VirtualProgram } from "./TestHost/VirtualProgram";

describe("getNodes()", () => {
    it("extracts types", () => {
        const host = new VirtualProgram({
            "main.ts": `
                // @ToTranspile
                interface A {
                    a: number;
                }

                interface B {
                    a: number;
                }

                // @ToTranspile
                type C = {
                    a: number;
                }

                type D = {
                    a: number;
                }

                // @ToTranspile
                interface E extends A {
                    b: string;
                }

                // @ToTranspile
                type F = D & C & {
                    b: boolean;
                }
            `,
        });
        const nodes = getNodes(host.program)({
            inJavaRegExpTest: /@InJava/,
            interfacePredicate: defaultInterfacePredicate(/@ToTranspile/),
            nativeReferences: [],
            tsconfigAbsolutePath: "",
        });

        expect(nodes).toHaveLength(4);

        expect(nodes.map((node) => node.name)).toEqual(["A", "C", "E", "F"]);
    });
});
