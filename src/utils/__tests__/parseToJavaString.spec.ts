import { left, right } from "fp-ts/lib/Either";

import { parseToJavaString, ToJavaSyntaxError } from "../parseToJavaString";

describe.each([
    [
        "@ToJava as Name to com.package.pack",
        right({ isEmpty: false, name: "Name", package: "com.package.pack" }),
    ],
    [
        "@ToJava to com.package.pack as Name",
        right({ isEmpty: false, name: "Name", package: "com.package.pack" }),
    ],
    ["@ToJava as Name", right({ isEmpty: false, name: "Name", package: null })],
    [
        "@ToJava to com.package.pack",
        right({ isEmpty: false, name: null, package: "com.package.pack" }),
    ],
    [
        "@ToJava com.package.pack",
        right({ isEmpty: false, name: null, package: "com.package.pack" }),
    ],
    [
        "@ToJava com.package.pack as Name",
        right({ isEmpty: false, name: "Name", package: "com.package.pack" }),
    ],
    ["@ToJava", right({ isEmpty: true, name: null, package: null })],
    [
        `@ToJava
        `,
        right({ isEmpty: true, name: null, package: null }),
    ],
    [
        `@ToJava 
            as Name 
            to com.package.pack
        `,
        right({ isEmpty: false, name: "Name", package: "com.package.pack" }),
    ],
    [
        `@ToJava   com.package.pack 
            as Name
        `,
        right({ isEmpty: false, name: "Name", package: "com.package.pack" }),
    ],
    [
        `@ToJava 
            com.package.pack
        `,
        right({ isEmpty: false, name: null, package: "com.package.pack" }),
    ],
    [
        "@ToJava com.package.pack.Name",
        left(
            new ToJavaSyntaxError(
                "@ToJava com.package.pack.Name",
                'Package contains upper-case in "@ToJava com.package.pack.Name"'
            )
        ),
    ],
    [
        "@ToJava as",
        left(
            new ToJavaSyntaxError(
                "@ToJava as",
                'No name specified after "as" keyword in "@ToJava as"'
            )
        ),
    ],
    [
        "@ToJava to",
        left(
            new ToJavaSyntaxError(
                "@ToJava to",
                'No package specified after "to" keyword in "@ToJava to"'
            )
        ),
    ],
    [
        "@ToJava to as",
        left(
            new ToJavaSyntaxError(
                "@ToJava to as",
                'No name specified after "as" keyword in "@ToJava to as"'
            )
        ),
    ],
    [
        "@ToJava as to",
        left(
            new ToJavaSyntaxError(
                "@ToJava as to",
                'No name specified after "as" keyword in "@ToJava as to"'
            )
        ),
    ],
    [
        "@ToJava com.pack as",
        left(
            new ToJavaSyntaxError(
                "@ToJava com.pack as",
                'No name specified after "as" keyword in "@ToJava com.pack as"'
            )
        ),
    ],
    [
        "@ToJava as Name to",
        left(
            new ToJavaSyntaxError(
                "@ToJava as Name to",
                'No package specified after "to" keyword in "@ToJava as Name to"'
            )
        ),
    ],
    [
        "as Name @ToJava com.package.pack",
        left(
            new ToJavaSyntaxError(
                "as Name @ToJava com.package.pack",
                'Marking directive must be at the the beginning of "as Name @ToJava com.package.pack"'
            )
        ),
    ],
    [
        "@ToJava com.package.pack as Name (We will rename this)",
        left(
            new ToJavaSyntaxError(
                "@ToJava com.package.pack as Name(We will rename this)",
                'Unknown keywords "(We will rename this)" in "@ToJava com.package.pack as Name (We will rename this)"'
            )
        ),
    ],
])(`parseToJavaString("%s")`, (comment, result) => {
    it(`returns correct result`, () => {
        expect(parseToJavaString(comment, /@ToJava/)).toEqual(result);
    });
});
