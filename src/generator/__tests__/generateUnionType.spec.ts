import { NumberLiteral, StringLiteral, UnionType } from "../../model";
import { generateUnionType } from "../generateUnionType";

describe("generateUnionType()", () => {
    it("works in common cases", () => {
        expect(
            generateUnionType(
                "AAA",
                "aaa",
                new UnionType([
                    new StringLiteral("option1"),
                    new StringLiteral("option2"),
                ])
            )
        ).toBe(`package aaa;

import static com.devexperts.client.reusable.core.JsNativesUtils.jsEnum;
import com.devexperts.client.reusable.core.JsEnum;

public interface AAA extends JsEnum {
    AAA OPTION1 = jsEnum("option1", AAA.class);
    AAA OPTION2 = jsEnum("option2", AAA.class);
}
`);

        expect(
            generateUnionType(
                "AAA",
                "aaa",
                new UnionType([new NumberLiteral(2), new NumberLiteral(3)])
            )
        ).toBe(`package aaa;

import static com.devexperts.client.reusable.core.JsNativesUtils.jsEnum;
import com.devexperts.client.reusable.core.JsEnum;

public interface AAA extends JsEnum {
    AAA AAA_2 = jsEnum(2, AAA.class);
    AAA AAA_3 = jsEnum(3, AAA.class);
}
`);
    });
});
