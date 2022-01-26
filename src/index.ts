/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import "./aliases";
import { outputFile } from "fs-extra";
import { chainW, fold } from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";

import { generate } from "./generator";
import { GeneratorConfig } from "./generator/generator.config";
import { parse } from "./parser";
import { ParserConfig } from "./parser/parser.model";

import { GeneratorResult } from "./generator/model";
import {
    defaultInterfacePredicate,
    defaultFieldPredicate,
} from "./utils/defaultPredicates";
import { MapSimplifiedInterfacesError } from "./parser/parser.errors";
import { chalk } from "./utils/chalk";
import { printParseTypeNodeError } from "./utils/printParseTypeNodeError";
import { CannotGenerateTypesError } from "./generator/generator.errors";
import { printTypeToStringError } from "./utils/printTypeToStringError";

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
    const parserConfig = {
        interfacePredicate:
            typeof config.interfacePredicate === "function"
                ? config.interfacePredicate
                : defaultInterfacePredicate(config.interfacePredicate),
        tsconfigAbsolutePath: config.tsconfigAbsolutePath,
        filePredicate: config.filePredicate,
        ignoreField:
            typeof config.ignoreField === "function"
                ? config.ignoreField
                : defaultFieldPredicate(config.ignoreField ?? /@ToJavaIgnore/),
        nativeReferences: config.nativeReferencesMap
            ? Object.keys(config.nativeReferencesMap)
            : [],
        inJavaRegExpTest: config.inJavaRegExpTest ?? /@InJava/,
        logs: config.logs,
    };

    const generatorConfig = {
        destinationFolder: config.destinationFolder,
        generateArrayType: config.generateArrayType,
        generateFunctionType: config.generateFunctionType,
        rootPackage: config.rootPackage,
        getGroupName: config.getGroupName,
        primitiveMapping: config.primitiveMapping,
        nativeReferencesMap: config.nativeReferencesMap ?? {},
    };

    pipe(
        parse()(parserConfig),
        chainW((value) => generate(value)(generatorConfig)),
        fold(
            (e) => {
                if (e instanceof MapSimplifiedInterfacesError) {
                    console.log(chalk.bgRed.black(e.message));
                    for (const error of e.errors) {
                        console.group();
                        console.log(chalk.bold.red(error.message));

                        console.group();
                        for (const fieldError of error.errors) {
                            console.log(
                                chalk.bold.red(fieldError.fieldName + ":")
                            );
                            console.group();
                            printParseTypeNodeError(fieldError.error);
                            console.groupEnd();
                        }
                        console.groupEnd();
                        console.groupEnd();
                    }
                    return;
                }
                if (e instanceof CannotGenerateTypesError) {
                    console.log(chalk.bold.red(e.message));
                    console.group();
                    for (const error of e.errors) {
                        console.log(chalk.bold.red(error.message));
                        console.group();
                        for (const fieldError of error.fieldErrors) {
                            console.log(chalk.red.bold(fieldError.message));
                            console.group();
                            printTypeToStringError(fieldError.error);
                            console.groupEnd();
                        }
                        console.groupEnd();
                    }
                    console.groupEnd();
                    return;
                }
                return console.error(e);
            },
            (res: GeneratorResult[]) => {
                res.forEach((file) => {
                    console.log(
                        chalk.green.bold(`Generating type ${file.name}`)
                    );
                    console.log(
                        chalk.green(`From: ${chalk.italic(file.sourcePath)}`)
                    );
                    console.log(chalk.green(`To: ${chalk.italic(file.path)}`));
                    outputFile(file.path, file.content);
                    if (file.children.length > 0) {
                        console.log(chalk.green(`Generating nested types:`));
                        console.group();
                        for (const child of file.children) {
                            console.log(
                                chalk.green(
                                    `Type ${child.name} to ${chalk.italic(
                                        child.path
                                    )}`
                                )
                            );
                            outputFile(child.path, child.content);
                        }
                        console.groupEnd();
                    }
                    console.log();
                });
            }
        )
    );
};
