import { map, right } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";

import { getNodesToTranspile } from "../getNodesToTranspile";
import { testConfig } from "./test.config";
import { VirtualProgram } from "./TestHost/VirtualProgram";

describe("getNodesToTranspile()", () => {
    const host = new VirtualProgram({
        "index.ts": `
            //@ToJava
            interface A {
                a: number
            }

            //@ToJava
            type B = {
                a: number
            }

            //@ToJava
            type C = number
        `,
        "host.ts": `
            type Pick<T, K extends keyof T> = {
                [P in K]: T[P];
            };
            // @ToJava
            type D = Pick<{ A: number, b: 2 }, 'b'>
        `,
    });

    it("works", () => {
        expect(
            pipe(
                testConfig,
                getNodesToTranspile(host.program),
                map((result) => result.map((i) => i.name))
            )
        ).toEqual(right(["A", "B", "D"]));
    });
});
