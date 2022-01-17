/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Either, map } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";

import { ObjectType } from "../model";
import { generateExtraType } from "./generateExtraType";
import { GeneratorConfig } from "./generator.config";
import { CannotGenerateInterfaceError } from "./generator.errors";
import { ExtraObject } from "./model";
import { TypeToStringError } from "./typeToString";

export const generateExtraObj = (
    name: string,
    pack: string,
    path: string,
    obj: ObjectType,
    config: GeneratorConfig,
    generateRef: (name: string, type: ObjectType) => { name: string }
): Either<CannotGenerateInterfaceError<TypeToStringError>, ExtraObject> => {
    return pipe(
        generateExtraType(name, pack, obj, config, generateRef),
        map((content) => ({
            content,
            name,
            path,
            type: obj,
        }))
    );
};
