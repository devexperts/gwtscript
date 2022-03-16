/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { resolve } from "path";

import { flatten, map } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { ReaderEither } from "fp-ts/lib/ReaderEither";

import { ObjectType, RefableType, TypeToGenerate } from "../model";
import { unEither } from "../utils/fp-ts/unEither";
import { generateContent } from "./generateContent";
import { generateExtraObj } from "./generateExtraObj";
import { generateUnionType } from "./generateUnionType";
import { GeneratorConfig } from "./generator.config";
import { CannotGenerateInterfaceError } from "./generator.errors";
import { ExtraObject, GeneratorResult } from "./model";
import { TypeToStringError } from "./typeToString";

export const generateType = (
    type: TypeToGenerate
): ReaderEither<
    GeneratorConfig,
    CannotGenerateInterfaceError<TypeToStringError>,
    GeneratorResult
> => (config) => {
    return flatten(
        unEither(
            generateExtraObj,
            {
                content: "ErrorContent",
                name: "Error",
                path: "Error",
                type: new ObjectType([]),
            },
            (unEithered) => {
                const name = type?.overrides?.name ?? type.name;

                const group =
                    config.getGroupName && !type?.overrides?.package
                        ? config.getGroupName(type)
                        : "";

                const folder = [config.destinationFolder, group];

                if (type?.overrides?.package)
                    folder.push(...type.overrides.package.split("."));

                folder.push(name.toLowerCase());

                const folderPath = resolve.apply(this, folder);

                const packageName = [
                    config.rootPackage,
                    group,
                    type?.overrides?.package,
                    name.toLowerCase(),
                ]
                    .filter((a) => !!a)
                    .join(".");

                const extraTypes = new Map<string, ExtraObject>();
                const handleRef = (objName: string, toRef: RefableType) => {
                    const extraName =
                        toRef.identifier === "object"
                            ? toRef.nameNotation ?? `${name}_${objName}`
                            : `${name}_${objName}`;

                    if (!extraTypes.has(extraName)) {
                        if (toRef.identifier === "object") {
                            extraTypes.set(
                                extraName,
                                unEithered(
                                    extraName,
                                    packageName,
                                    resolve(folderPath, `${extraName}.java`),
                                    toRef,
                                    config,
                                    handleRef
                                )
                            );
                        } else {
                            const content = generateUnionType(
                                extraName,
                                packageName,
                                toRef
                            );
                            extraTypes.set(extraName, {
                                content,
                                name: extraName,
                                path: resolve(folderPath, `${extraName}.java`),
                                type: toRef,
                            });
                        }
                    }
                    const val = extraTypes.get(extraName);
                    return {
                        name: val.name,
                    };
                };

                return pipe(
                    config,
                    generateContent(type, packageName, handleRef),
                    map((content) => ({
                        content,
                        name: name,
                        path: resolve(folderPath, `${name}.java`),
                        children: Array.from(extraTypes.values()),
                        sourceName: type.name,
                        sourcePath: type.sourcePath,
                    }))
                );
            }
        )
    );
};
