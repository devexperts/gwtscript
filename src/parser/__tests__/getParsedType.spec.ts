import { left, right } from "fp-ts/lib/Either";

import { NumberLiteral, PrimitiveType, UnionType } from "../../model";
import { getParsedType } from "../getParsedType";
import { CannotParseTypeError } from "../parser.errors";
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
            numLiteral: td`type A = 2`,
        },
    });

    describe.each([
        [host.getNode("null"), right(new PrimitiveType("VOID"))],
        [host.getNode("number"), right(new PrimitiveType("NUMBER"))],
        [host.getNode("string"), right(new PrimitiveType("STRING"))],
        [host.getNode("undef"), right(new PrimitiveType("VOID"))],
        [host.getNode("void"), right(new PrimitiveType("VOID"))],
        [host.getNode("bool"), right(new PrimitiveType("BOOLEAN"))],
        [
            host.getNode("boolOrNumber"),
            right(
                new UnionType([
                    new PrimitiveType("NUMBER"),
                    new PrimitiveType("BOOLEAN"),
                ])
            ),
        ],
        [
            host.getNode("obj"),
            left(
                new CannotParseTypeError(
                    "",
                    "",
                    "",
                    host.checker.getTypeAtLocation(host.getNode("obj"))
                )
            ),
        ],
        [host.getNode("numLiteral"), right(new NumberLiteral(2))],
    ])("table test", (node, result) => {
        it("works with primitives", () => {
            expect(
                getParsedType(host.checker.getTypeAtLocation(node.type))({
                    fieldName: "",
                    location: "",
                    typeName: "",
                })
            ).toEqual(result);
        });
    });
});
