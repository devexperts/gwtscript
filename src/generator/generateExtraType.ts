/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import {
    map as mapReader,
    mapLeft as mapLeftReader,
} from "fp-ts/lib/ReaderEither";
import { Either, map, mapLeft } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";

import { sequenceReaderEither } from "@root/utils/sequenceReaderEither";

import { ObjectType, RefableType } from "../model";
import { GeneratorConfig } from "./generator.config";
import {
    CannotGenerateFieldError,
    CannotGenerateInterfaceError,
} from "./generator.errors";
import { typeToString, TypeToStringError } from "./typeToString";

export const generateExtraType = (
    name: string,
    pack: string,
    type: ObjectType,
    config: GeneratorConfig,
    generateRef: (name: string, type: RefableType) => { name: string }
): Either<CannotGenerateInterfaceError<TypeToStringError>, string> => {
    return pipe(
        pipe(
            config,
            sequenceReaderEither(
                type.type.map((val) =>
                    pipe(
                        typeToString(val.type, (f) => generateRef(val.name, f)),
                        mapReader((str) => ({
                            ...str,
                            name: val.name,
                        })),
                        mapLeftReader(
                            (err) => new CannotGenerateFieldError(val.name, err)
                        )
                    )
                )
            ),
            map((types) => {
                const imports = new Set<string>([]);

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
            })
        ),
        map(({ imports, fields }) => {
            return `package ${pack};

${imports.map((i) => `import ${i};`).join(`
`)}


public class ${name} {
    ${fields.map((field) => {
        return `public ${field.type} ${field.name};`;
    }).join(`
    `)}
}
`;
        }),
        mapLeft((errors) => new CannotGenerateInterfaceError(name, errors))
    );
};
