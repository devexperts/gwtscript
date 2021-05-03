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
