/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

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
        public path: string,
        public localFieldName: string
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
        super(`Cannot parse a type`);
        Object.setPrototypeOf(this, CannotParseTypeError.prototype);
    }
}

export class FailedToParseUnionError<E extends Error = Error> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: E[]
    ) {
        super(`Cannot parse a union type`);
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
        super(`Cannot parse type`);
        Object.setPrototypeOf(this, CannotParseTypeNodeError.prototype);
    }
}
export class FailedToParseFunctionReturnTypeError<
    EType extends Error = Error
> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public error: EType
    ) {
        super(`Cannot parse a return type of a function`);
        Object.setPrototypeOf(
            this,
            FailedToParseFunctionReturnTypeError.prototype
        );
    }
}

export class FailedToParseFunctionParameterError<
    E extends Error = Error
> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public argName: string,
        public error: E
    ) {
        super(`Cannot parse function parameter ${argName}`);
        Object.setPrototypeOf(
            this,
            FailedToParseFunctionParameterError.prototype
        );
    }
}

export class FailedToParseFunctionParametersError<
    EType extends Error = Error
> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: FailedToParseFunctionParameterError<EType>[]
    ) {
        super(`Cannot parse function parameters`);
        Object.setPrototypeOf(
            this,
            FailedToParseFunctionParametersError.prototype
        );
    }
}

export class FailedToParseGenericParametersForNativeReferenceTypeError<
    E extends Error = Error
> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: E[]
    ) {
        super(`Cannot parse parameters of a function`);
        Object.setPrototypeOf(
            this,
            FailedToParseGenericParametersForNativeReferenceTypeError.prototype
        );
    }
}

export class FailedToParsePrimitiveReferenceTypeError<
    E extends Error = Error
> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public error: E
    ) {
        super(`Failed to parse the reference to a primitive type`);
        Object.setPrototypeOf(
            this,
            FailedToParsePrimitiveReferenceTypeError.prototype
        );
    }
}

export class FailedToParseReferenceToTypeError<
    E extends Error = Error
> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: E[]
    ) {
        super(`Failed to parse the reference to a type`);
        Object.setPrototypeOf(
            this,
            FailedToParseReferenceToTypeError.prototype
        );
    }
}

export class FailedToGetEscapedName extends Error {
    constructor(
        public propertyName: ts.PropertyName | ts.EntityName | ts.BindingName
    ) {
        super(`Failed to get escaped name`);
        Object.setPrototypeOf(this, FailedToGetEscapedName.prototype);
    }
}

export class FailedToParseObjectFieldError<
    E extends Error = Error
> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public localFieldName: string,
        public error: E
    ) {
        super(`Failed to parse field ${localFieldName}`);
        Object.setPrototypeOf(this, FailedToParseObjectFieldError.prototype);
    }
}

export class FailedToParseObjectError<E extends Error = Error> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: FailedToParseObjectFieldError<E>[]
    ) {
        super(`Failed to parse object type`);
        Object.setPrototypeOf(this, FailedToParseObjectError.prototype);
    }
}

export class FailedToParseIntersectionError<
    ErrorType extends Error = Error
> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public errors: ErrorType[]
    ) {
        super(`Failed to parse type intersection`);
        Object.setPrototypeOf(this, FailedToParseIntersectionError.prototype);
    }
}

export class FailedToParseInterfaceFieldError<ErrorType = Error> extends Error {
    constructor(
        public typeName: string,
        public fieldName: string,
        public path: string,
        public error: ErrorType
    ) {
        super(`Failed to parse interface field "${fieldName}"`);
        Object.setPrototypeOf(this, FailedToParseInterfaceFieldError.prototype);
    }
}

export class FailedToParseInterface<ErrorType = Error> extends Error {
    constructor(
        public typeName: string,
        public path: string,
        public errors: FailedToParseInterfaceFieldError<ErrorType>[]
    ) {
        super(`Failed to parse interface`);
        Object.setPrototypeOf(this, FailedToParseInterface.prototype);
    }
}

export class MapSimplifiedInterfacesError<ErrorType = Error> extends Error {
    constructor(public errors: ErrorType[]) {
        super(`Failed to parse some interfaces`);
        Object.setPrototypeOf(this, MapSimplifiedInterfacesError.prototype);
    }
}
