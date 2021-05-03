import * as ts from "typescript";

export class VirtualProgram<Files extends { [fileName: string]: string }> {
    program: ts.Program;

    checker: ts.TypeChecker;

    constructor(files: Files) {
        const host: ts.CompilerHost = {
            fileExists: (name) => name in files,
            getCanonicalFileName: (f) => f,
            getCurrentDirectory: () => "",
            getDefaultLibFileName: () => "lib.d.ts",
            getNewLine: () => "\n",
            getSourceFile: (fileName: string) => {
                if (fileName in files) {
                    const content = files[fileName];
                    return ts.createSourceFile(
                        fileName,
                        content,
                        ts.ScriptTarget.ES2015
                    );
                }
                return ts.createSourceFile("", "", ts.ScriptTarget.ES2015);
            },
            readFile: () => "",
            useCaseSensitiveFileNames: () => false,
            writeFile: () => "",
        };

        this.program = ts.createProgram(Object.keys(files), {}, host);

        this.checker = this.program.getTypeChecker();
    }

    getFile<K extends keyof Files>(name: K): ts.SourceFile {
        return this.program.getSourceFile(name.toString());
    }
}
