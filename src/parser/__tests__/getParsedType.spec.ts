import { none, some } from "fp-ts/lib/Option";
import { PrimitiveType } from "../../model";
import { getParsedType } from "../getParsedType";
import { td, TestHost } from "./TestHost";

describe("getParsedType()", () => {
    const host = new TestHost({
        declarations: {
            number: td`type A = number`,
            string: td`type A = string`,
            bool: td`type A = boolean`,
            null: td`type A = null`,
            undef: td`type A = undefined`,
            void: td`type A = void`,
            boolOrNumber: td`type A = boolean | number`,
            obj: td`type A = { a: number }`,
            numErr: td`type A = 2`,
        },
    });

    describe.each([
        [host.getNode("null"), some(new PrimitiveType("VOID"))],
        [host.getNode("number"), some(new PrimitiveType("NUMBER"))],
        [host.getNode("string"), some(new PrimitiveType("STRING"))],
        [host.getNode("undef"), some(new PrimitiveType("VOID"))],
        [host.getNode("void"), some(new PrimitiveType("VOID"))],
        [host.getNode("bool"), some(new PrimitiveType("BOOLEAN"))],
        [host.getNode("boolOrNumber"), none],
        [host.getNode("obj"), none],
        [host.getNode("numErr"), none],
    ])("table test", (node, result) => {
        it("works with primitives", () => {
            expect(
                getParsedType(host.checker.getTypeAtLocation(node.type))
            ).toEqual(result);
        });
    });
});
