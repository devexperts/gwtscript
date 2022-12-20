import { isLeft, isRight } from "fp-ts/lib/Either";

import { UserType } from "../../model";
import { parseInJavaString } from "../parseInJavaString";

describe("parseInJavaString()", () => {
    const testFunction = parseInJavaString(/@InJava/);

    it("works in common case", () => {
        const result = testFunction("// @InJava String from nothing");
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
    it("works in cases with generic arguments", () => {
        const result = testFunction("// @InJava A<B, C> from nothing");
        const right = isRight(result);
        expect(right).toBe(true);

        if (isRight(result)) {
            expect(result.right).toEqual(
                new UserType({
                    imports: ["nothing"],
                    text: "A<B, C>",
                })
            );
        }
    });
    it("works with several imports", () => {
        const result = testFunction("// @InJava String from nothing, nothing2");
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
        const result = testFunction("// @InJava String");
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
        const result = testFunction(
            "//    @InJava     String       from        nothing,        nothing2"
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
        expect(isLeft(testFunction("// @InJava String from"))).toBe(true);
        expect(isLeft(testFunction("// @InJava Str ing from nothing"))).toBe(
            true
        );
        expect(isLeft(testFunction("// @InJava Str ing"))).toBe(true);
        expect(isLeft(testFunction("// @InJava"))).toBe(true);
    });
});
