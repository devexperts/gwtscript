/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { Option, none, some } from "fp-ts/Option";
import * as ts from "typescript";
import { getDirFromPath } from "./getDirFromPath";

export function createProgram(tsConfigPath: string): Option<ts.Program> {
    const configPath = ts.findConfigFile(tsConfigPath, ts.sys.fileExists);
    if (!configPath) return none;

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
        console.log(
            ts.formatDiagnosticsWithColorAndContext(errors, compilerHost)
        );
        return none;
    }

    return some(program);
}
