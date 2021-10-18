/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { outputFile } from "fs-extra";
import { generate } from "./generator";
import { GeneratorConfig } from "./generator/generator.config";
import { parse } from "./parser";
import { ParserConfig } from "./parser/parser.model";

import { chainW, fold } from "fp-ts/Either";
import { GeneratorResult } from "./generator/model";
import {
    defaultInterfacePredicate,
    defaultFieldPredicate,
} from "./utils/defaultPredicates";
import { pipe } from "fp-ts/lib/function";

export type CompilerConfig = Omit<
    ParserConfig,
    | "interfacePredicate"
    | "ignoreField"
    | "nativeReferences"
    | "inJavaRegExpTest"
> &
    Omit<GeneratorConfig, "nativeReferencesMap"> & {
        interfacePredicate: ParserConfig["interfacePredicate"] | RegExp;
        ignoreField?: ParserConfig["ignoreField"] | RegExp;
        inJavaRegExpTest?: ParserConfig["inJavaRegExpTest"];
        nativeReferencesMap?: GeneratorConfig["nativeReferencesMap"];
    };

export const compile = (config: CompilerConfig): void => {
    pipe(
        parse({
            interfacePredicate:
                typeof config.interfacePredicate === "function"
                    ? config.interfacePredicate
                    : defaultInterfacePredicate(config.interfacePredicate),
            tsconfigAbsolutePath: config.tsconfigAbsolutePath,
            filePredicate: config.filePredicate,
            ignoreField:
                typeof config.ignoreField === "function"
                    ? config.ignoreField
                    : defaultFieldPredicate(
                          config.ignoreField ?? /@ToJavaIgnore/
                      ),
            nativeReferences: config.nativeReferencesMap
                ? Object.keys(config.nativeReferencesMap)
                : [],
            inJavaRegExpTest: config.inJavaRegExpTest ?? /@InJava/,
            logs: config.logs,
        }),
        chainW(
            generate({
                destinationFolder: config.destinationFolder,
                generateArrayType: config.generateArrayType,
                generateFunctionType: config.generateFunctionType,
                rootPackage: config.rootPackage,
                getGroupName: config.getGroupName,
                primitiveMapping: config.primitiveMapping,
                nativeReferencesMap: config.nativeReferencesMap ?? {},
            })
        ),
        fold(
            (e) => console.error(e),
            (res: GeneratorResult[]) => {
                res.forEach((file) => {
                    outputFile(file.path, file.content);
                });
            }
        )
    );
};
