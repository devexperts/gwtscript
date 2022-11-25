/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import "./aliases";
import { outputFile } from "fs-extra";
import { chainW, fold, isRight } from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";

import { generate } from "./generator";
import { parse, ParserError } from "./parser";

import { GeneratorResult } from "./generator/model";
import {
    defaultInterfacePredicate,
    defaultFieldPredicate,
} from "./utils/defaultPredicates";
import { chalk } from "./utils/chalk";
import { printParseTypeNodeError } from "./utils/printParseTypeNodeError";
import { CannotGenerateTypesError } from "./generator/generator.errors";
import { printTypeToStringError } from "./utils/printTypeToStringError";
import { CompilerConfig, ParserOutput, UserParserConfig } from "./model";
import { isCompilerConfig } from "./utils/guards/isCompilerConfig";
import { FailedToCheckMarkingDirective } from "./parser/parser.errors";

type BasicCompilerArguments = [CompilerConfig];
type WithUserGeneratorArguments = [
    UserParserConfig,
    (err: ParserError | null, result: ParserOutput) => void
];

export function compile(...args: BasicCompilerArguments): void;
export function compile(...args: WithUserGeneratorArguments): void;
export function compile(
    ...args: BasicCompilerArguments | WithUserGeneratorArguments
): void {
    const config = args[0];
    const interfacePredicate = config.interfacePredicate ?? /@ToJava/;

    const parserConfig = {
        interfacePredicateRegexp:
            typeof interfacePredicate === "function"
                ? undefined
                : interfacePredicate,
        interfacePredicate:
            typeof interfacePredicate === "function"
                ? interfacePredicate
                : defaultInterfacePredicate(interfacePredicate),
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

    const parserOutput = parse()(parserConfig);

    if (!isCompilerConfig(config)) {
        if (isRight(parserOutput)) {
            args[1](null, parserOutput.right);
        } else {
            args[1](parserOutput.left, undefined);
        }
        return;
    }

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
        parserOutput,
        chainW((value) => generate(value)(generatorConfig)),
        fold(
            (e) => {
                if (e instanceof ParserError) {
                    console.log(chalk.bgRed.black(e.message));
                    console.group();
                    if (e.errors instanceof Array) {
                        for (const error of e.errors) {
                            if (
                                error instanceof FailedToCheckMarkingDirective
                            ) {
                                console.log(chalk.bold.red(error.message));
                                console.group();
                                console.log(
                                    chalk.bold.red(error.error.message)
                                );
                                console.groupEnd();
                            } else {
                                console.log(chalk.bold.red(error.message));
                                console.group();
                                if (error.errors instanceof Array) {
                                    for (const parsingError of error.errors) {
                                        console.log(
                                            chalk.bold.red(parsingError.message)
                                        );
                                        console.group();
                                        printParseTypeNodeError(
                                            parsingError.error
                                        );
                                        console.groupEnd();
                                    }
                                } else {
                                    console.log(
                                        chalk.bold.red(error.errors.message)
                                    );
                                }
                                console.groupEnd();
                            }
                        }
                    } else {
                        console.log(chalk.bgRed.black(e.errors.message));
                    }
                    console.groupEnd();
                } else if (e instanceof CannotGenerateTypesError) {
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
                }
                process.exit(1);
            },
            (res: GeneratorResult[]) => {
                res.forEach((file) => {
                    if (file.name !== file.sourceName) {
                        console.log(
                            chalk.green.bold(`Generating type ${file.name}`),
                            chalk.bgYellow.black(
                                ` Name was overridden from "${file.sourceName}" `
                            )
                        );
                    } else {
                        console.log(
                            chalk.green.bold(`Generating type ${file.name}`)
                        );
                    }
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
}
