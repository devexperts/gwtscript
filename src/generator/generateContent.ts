/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { map, mapLeft } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { ReaderEither } from "fp-ts/lib/ReaderEither";

import { RefableType, TypeToGenerate } from "../model";
import { sequenceEither } from "../utils/fp-ts/sequenceEither";
import { GeneratorConfig } from "./generator.config";
import {
    CannotGenerateInterfaceError,
    CannotGenerateFieldError,
} from "./generator.errors";
import { typeToString, TypeToStringError } from "./typeToString";

export const generateContent = (
    type: TypeToGenerate,
    pack: string,
    generateRef: (name: string, type: RefableType) => { name: string }
): ReaderEither<
    GeneratorConfig,
    CannotGenerateInterfaceError<TypeToStringError>,
    string
> => (config) => {
    return pipe(
        sequenceEither(
            type.fields.map((val) => {
                return pipe(
                    config,
                    typeToString(val.type, (f) => generateRef(val.name, f)),
                    map((str) => ({
                        ...str,
                        name: val.name,
                    })),
                    mapLeft(
                        (error) => new CannotGenerateFieldError(val.name, error)
                    )
                );
            })
        ),
        map((types) => {
            const imports = new Set([
                "jsinterop.annotations.JsPackage",
                "jsinterop.annotations.JsType",
                "gwt.react.client.proptypes.BaseProps",
            ]);

            return {
                fields: types.map((type) => {
                    type.imports.forEach((i) => imports.add(i));
                    return {
                        name: type.name,
                        type: type.result,
                    };
                }),
                imports: Array.from(imports),
            };
        }),
        map(({ imports, fields }) => {
            return `package ${pack};

${imports.map((i) => `import ${i};`).join(`
`)}

// Source: type ${type.name} from ${type.sourcePath}
@JsType(isNative = true, namespace = JsPackage.GLOBAL, name = "Object")
public class ${type?.overrides?.name ?? type.name} extends BaseProps {
    ${fields.map((field) => {
        return `public ${field.type} ${field.name};`;
    }).join(`
    `)}
}
`;
        }),
        mapLeft((errors) => {
            return new CannotGenerateInterfaceError(type.name, errors);
        })
    );
};
