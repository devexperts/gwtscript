import ts from "typescript";

export class CannotFindConfigError extends Error {
    constructor(path: string){
        super(`Cannot find tsconfig with path "${path}"`);
        Object.setPrototypeOf(this, CannotFindConfigError.prototype)
    }
}

export class TSCompilerError extends Error {
    constructor(message: string, public diagnostics: readonly ts.Diagnostic[]){
        super(`TS compiler errors:
${message}`);
        Object.setPrototypeOf(this, TSCompilerError.prototype)
    }
}

export class EmptyShapeException extends Error {
    constructor(public typeName: string, public path: string) {
        super(`Type ${typeName} (located: "${path}") is empty`)
    }
}

export class UnknownSignatureError extends Error {
    constructor(public typeName: string, public fieldName: string, public path: string) {
        super(`Field "${fieldName}" on type ${typeName} is not a PropertySignature or MethodSignature (located: "${path}")`)
    }
}