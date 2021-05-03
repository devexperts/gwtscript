import { isLeft, isRight } from "fp-ts/lib/Either";
import { UserType } from "../../model";
import { ParserConfig } from "../../parser/parser.model";
import { parseInJavaString } from "../parseInJavaString";

describe("parseInJavaString()", () => {
    const conf: ParserConfig = {
        inJavaRegExpTest: /@InJava/,
        interfacePredicate: () => true,
        nativeReferences: [],
        tsconfigAbsolutePath: "",
    };
    it("works in common case", () => {
        const result = parseInJavaString(
            "// @InJava String from nothing",
            conf
        );
        const right = isRight(result);
        expect(right).toBe(true);

        if (isRight(result)) {
            expect(result.right).toEqual(
                new UserType({
                    imports: ["nothing"],
                    text: "String",
                })
            );
        }
    });
    it("works with several imports", () => {
        const result = parseInJavaString(
            "// @InJava String from nothing, nothing2",
            conf
        );
        const right = isRight(result);
        expect(right).toBe(true);

        if (isRight(result)) {
            expect(result.right).toEqual(
                new UserType({
                    imports: ["nothing", "nothing2"],
                    text: "String",
                })
            );
        }
    });
    it("works with zero-imports", () => {
        const result = parseInJavaString("// @InJava String", conf);
        const right = isRight(result);
        expect(right).toBe(true);

        if (isRight(result)) {
            expect(result.right).toEqual(
                new UserType({
                    imports: [],
                    text: "String",
                })
            );
        }
    });
    it("works in odd case", () => {
        const result = parseInJavaString(
            "//    @InJava     String       from        nothing,        nothing2",
            conf
        );
        const right = isRight(result);
        expect(right).toBe(true);

        if (isRight(result)) {
            expect(result.right).toEqual(
                new UserType({
                    imports: ["nothing", "nothing2"],
                    text: "String",
                })
            );
        }
    });

    it("throws errors", () => {
        expect(isLeft(parseInJavaString("// @InJava String from", conf))).toBe(
            true
        );
        expect(
            isLeft(parseInJavaString("// @InJava Str ing from nothing", conf))
        ).toBe(true);
        expect(isLeft(parseInJavaString("// @InJava Str ing", conf))).toBe(
            true
        );
        expect(isLeft(parseInJavaString("// @InJava", conf))).toBe(true);
    });
});
