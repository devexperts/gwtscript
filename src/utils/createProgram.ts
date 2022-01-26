/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { Either, left, right } from "fp-ts/lib/Either";

import {
    CannotFindConfigError,
    TSCompilerError,
} from "../parser/parser.errors";
import { getDirFromPath } from "./getDirFromPath";

export function createProgram(
    tsConfigPath: string
): Either<CannotFindConfigError, ts.Program> {
    const configPath = ts.findConfigFile(tsConfigPath, ts.sys.fileExists);

    if (!configPath) return left(new CannotFindConfigError(tsConfigPath));

    const config = ts.readJsonConfigFile(configPath, ts.sys.readFile);

    const { fileNames, options } = ts.parseJsonSourceFileConfigFileContent(
        config,
        ts.sys,
        getDirFromPath(config.fileName)
    );
    const program = ts.createProgram(fileNames, options);

    const compilerHost = ts.createCompilerHost(options);

    const errors = ts.getPreEmitDiagnostics(program);

    if (errors.length > 0) {
        return left(
            new TSCompilerError(
                ts.formatDiagnosticsWithColorAndContext(errors, compilerHost),
                errors
            )
        );
    }

    return right(program);
}
