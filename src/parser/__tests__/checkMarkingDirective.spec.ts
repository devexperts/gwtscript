import * as Either from "fp-ts/lib/Either";

import {
    checkMarkingDirective,
    NoCommentLines,
} from "../checkMarkingDirective";
import { ParserConfig } from "../parser.model";

import { ifc, TestHost } from "./TestHost";

describe("checkMarkingDirective()", () => {
    const testConfig: ParserConfig = {
        inJavaRegExpTest: /@/,
        interfacePredicate: () => true,
        nativeReferences: [],
        tsconfigAbsolutePath: "",
        interfacePredicateRegexp: /@ToTranspile/,
    };

    const host = new TestHost({
        declarations: {
            normal: ifc`
                // smol comment
                // @ToTranspile
                interface A {
                    a: number;
                }
            `,
            errorDirective: ifc`
                // @ToTranspile asdsdaass
                interface A {
                    a: number
                }
            `,
            noDirective: ifc`
                interface A {
                    a: number
                }
            `,
        },
    });
    it("works in normal case", () => {
        const parserResult = {
            isEmpty: true,
            name: null,
            package: null,
        };
        expect(
            checkMarkingDirective(() => Either.right(parserResult))(
                host.getNode("normal")
            )(testConfig)
        ).toEqual(
            Either.right({
                node: host.getNode("normal"),
                overrides: parserResult,
            })
        );
    });
    it("throws correct error", () => {
        const checker = checkMarkingDirective(() =>
            Either.left(new Error("ParsingError"))
        );
        const errorDirective = checker(host.getNode("errorDirective"))(
            testConfig
        );

        const noDirective = checker(host.getNode("noDirective"))(testConfig);

        expect(noDirective).toEqual(Either.left(new NoCommentLines()));

        expect(errorDirective).toEqual(Either.left(new Error("ParsingError")));
    });
});
