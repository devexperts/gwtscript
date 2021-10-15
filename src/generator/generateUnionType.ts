/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { StringLiteral, UnionType, NumberLiteral } from "../model";

export const generateUnionType = (
    name: string,
    pack: string,
    type: UnionType<NumberLiteral> | UnionType<StringLiteral>
): string => {
    const fields: ReadonlyArray<StringLiteral | NumberLiteral> = type.type;

    return `package ${pack};

import static com.devexperts.client.reusable.core.JsNativesUtils.jsEnum;
import com.devexperts.client.reusable.core.JsEnum;

public interface ${name} extends JsEnum {
    ${fields.map(
        (val) =>
            `${name} ${
                typeof val.type === "string"
                    ? val.type.toUpperCase()
                    : `${name.toUpperCase()}_${val.type}`
            } = jsEnum(${
                typeof val.type === "string" ? `"${val.type}"` : val.type
            }, ${name}.class);`
    ).join(`
    `)}
}
`;
};
