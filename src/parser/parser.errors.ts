import ts from "typescript";

export class CannotFindConfigError extends Error {
    constructor(path: string) {
        super(`Cannot find tsconfig with path "${path}"`);
        Object.setPrototypeOf(this, CannotFindConfigError.prototype);
    }
}

export class TSCompilerError extends Error {
    constructor(message: string, public diagnostics: readonly ts.Diagnostic[]) {
        super(`TS compiler errors:
${message}`);
        Object.setPrototypeOf(this, TSCompilerError.prototype);
    }
}

export class EmptyShapeException extends Error {
    constructor(public typeName: string, public path: string) {
        super(`Type ${typeName} (located: "${path}") is empty`);
        Object.setPrototypeOf(this, EmptyShapeException.prototype);
    }
}

export class UnknownSignatureError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string
    ) {
        super(
            `Field "${fieldName}" on type ${typeName} is not a PropertySignature or MethodSignature (located: "${path}")`
        );
        Object.setPrototypeOf(this, UnknownSignatureError.prototype);
    }
}

export class CannotParseTypeError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public subject: ts.Type
    ) {
        super(
            `Cannot parse a type in ${typeName}.${fieldName} (located: "${path}")`
        );
        Object.setPrototypeOf(this, CannotParseTypeError.prototype);
    }
}

export class FailedToParseUnionError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: Error[]
    ) {
        super(
            `Cannot parse a union type in ${typeName}.${fieldName} (located: "${path}")`
        );
        Object.setPrototypeOf(this, FailedToParseUnionError.prototype);
    }
}

export class CannotParseTypeNodeError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public typeNode: ts.TypeNode | ts.TypeElement
    ) {
        super(
            `Cannot parse type in ${typeName}.${fieldName}  (located: "${path}")`
        );
        Object.setPrototypeOf(this, CannotParseTypeNodeError.prototype);
    }
}
export class FailedToParseFunctionReturnTypeError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public error: Error
    ) {
        super(
            `Cannot parse a return type of a function in ${typeName}.${fieldName} (located: "${path}")`
        );
        Object.setPrototypeOf(
            this,
            FailedToParseFunctionReturnTypeError.prototype
        );
    }
}

export class FailedToParseFunctionParametersError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: Error[]
    ) {
        super(
            `Cannot parse parameters of a function in ${typeName}.${fieldName} (located: "${path}")`
        );
        Object.setPrototypeOf(
            this,
            FailedToParseFunctionParametersError.prototype
        );
    }
}

export class FailedToParseGenericParametersForNativeReferenceTypeError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: Error[]
    ) {
        super(
            `Cannot parse parameters of a function in ${typeName}.${fieldName} (located: "${path}")`
        );
        Object.setPrototypeOf(
            this,
            FailedToParseGenericParametersForNativeReferenceTypeError.prototype
        );
    }
}

export class FailedToParsePrimitiveReferenceTypeError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public error: Error
    ) {
        super(
            `Failed to parse the reference to a primitive type in ${typeName}.${fieldName} (located: "${path}")`
        );
        Object.setPrototypeOf(
            this,
            FailedToParsePrimitiveReferenceTypeError.prototype
        );
    }
}

export class FailedToParseReferenceToTypeError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: Error[]
    ) {
        super(
            `Failed to parse the reference to a type in ${typeName}.${fieldName} (located: "${path}")`
        );
        Object.setPrototypeOf(
            this,
            FailedToParseReferenceToTypeError.prototype
        );
    }
}

export class FailedToGetEscapedName extends Error {
    constructor(public propertyName: ts.PropertyName) {
        super(`Failed to get escaped name`);
        Object.setPrototypeOf(this, FailedToGetEscapedName.prototype);
    }
}

export class FailedToParseObjectError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: Error[]
    ) {
        super(
            `Failed to parse object type in ${typeName}.${fieldName} (located: "${path}")`
        );
        Object.setPrototypeOf(this, FailedToParseObjectError.prototype);
    }
}

export class FailedToParseIntersectionError extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: Error[]
    ) {
        super(
            `Failed to parse type intersection in ${typeName}.${fieldName} (located: "${path}")`
        );
        Object.setPrototypeOf(this, FailedToParseIntersectionError.prototype);
    }
}

export class FailedToParseInterface<ErrorType = Error> extends Error {
    constructor(
        public typeName: string,
        public path: string,
        public errors: ErrorType[]
    ) {
        super(`Failed to parse interface ${typeName} (location: ${path})`);
        Object.setPrototypeOf(this, FailedToParseInterface.prototype);
    }
}

export class MapSimplifiedInterfacesError<ErrorType = Error> extends Error {
    constructor(public errors: ErrorType[]) {
        super(`Failed to parse some interfaces`);
        Object.setPrototypeOf(this, MapSimplifiedInterfacesError.prototype);
    }
}
