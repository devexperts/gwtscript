import * as ts from "typescript";

import { Ast } from "./tags";

export type TestHostConfig<
    Declarations extends Record<string, (name: string) => Ast<any>>
> = {
    declarations: Declarations;
};

type AstMap<Declarations extends Record<string, (name: string) => Ast<any>>> = {
    [K in keyof Declarations]: ReturnType<Declarations[K]>["ast"];
};

export class TestHost<
    Declarations extends Record<string, (name: string) => Ast<any>>
> {
    private astMap: AstMap<Declarations>;

    public checker: ts.TypeChecker;

    public program: ts.Program;

    constructor(public config: TestHostConfig<Declarations>) {
        const tempoMap: Partial<AstMap<Declarations>> = {};
        for (const key in config.declarations) {
            const ast = config.declarations[key](key);
            tempoMap[key] = ast;
        }
        const keys = Object.keys(tempoMap);
        const host: ts.CompilerHost = {
            fileExists: (name) => keys.includes(name.slice(0, -3)),
            getCanonicalFileName: (f) => f,
            getCurrentDirectory: () => "",
            getDefaultLibFileName: () => "lib.d.ts",
            getNewLine: () => "\n",
            getSourceFile: (fileName: string) => {
                const name = fileName.slice(0, -3);
                if (name in tempoMap) return tempoMap[name].file;
                return ts.createSourceFile("", "", ts.ScriptTarget.ES2015);
            },
            readFile: () => "",
            useCaseSensitiveFileNames: () => false,
            writeFile: () => "",
        };

        const program = ts.createProgram(
            Object.keys(tempoMap),
            {
                isolatedModules: true,
            },
            host
        );

        const errors = program.getDeclarationDiagnostics();
        if (errors.length > 0) {
            console.error(errors);
        }

        this.checker = program.getTypeChecker();
        this.program = program;
        if (this.isFull(tempoMap)) {
            this.astMap = tempoMap;
        }
    }

    isFull(part: Partial<AstMap<Declarations>>): part is AstMap<Declarations> {
        for (const key in this.config.declarations) {
            if (key in part) continue;
            else return false;
        }

        return true;
    }

    getNode<K extends keyof Declarations>(
        key: K
    ): ReturnType<Declarations[K]>["ast"] {
        return this.astMap[key].ast;
    }
}
