/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { ReferenceType } from "../model";

export class UndefinedDestinationFor extends Error {
    constructor(public typeName: string) {
        super();
        Object.setPrototypeOf(this, UndefinedDestinationFor.prototype);
    }
}

export class ReferenceTypeGenericError extends Error {
    constructor(
        public typeName: string,
        public errors: Error[],
        public type: ReferenceType
    ) {
        super(`Error with ${typeName}`);
        Object.setPrototypeOf(this, ReferenceTypeGenericError.prototype);
    }
}

export class CannotGenerateInterfaceError<
    E extends Error = Error
> extends Error {
    constructor(
        public typeName: string,
        public fieldErrors: CannotGenerateFieldError<E>[]
    ) {
        super(`Cannot generate interface "${typeName}"`);
        Object.setPrototypeOf(this, CannotGenerateInterfaceError.prototype);
    }
}

export class CannotStringifyVoidError extends Error {
    constructor() {
        super("Cannot stringify void if it's not a function return type");
        Object.setPrototypeOf(this, CannotStringifyVoidError.prototype);
    }
}

export class CannotGenerateFunctionArgumentError<
    E extends Error = Error
> extends Error {
    constructor(public argName: string, public error: E) {
        super(`Cannot generate function argument "${argName}"`);
        Object.setPrototypeOf(
            this,
            CannotGenerateFunctionArgumentError.prototype
        );
    }
}

export class CannotGenerateFunctionArgumentsError<
    E extends Error = Error
> extends Error {
    constructor(public errors: CannotGenerateFunctionArgumentError<E>[]) {
        super(`Cannot generate function arguments`);
        Object.setPrototypeOf(
            this,
            CannotGenerateFunctionArgumentsError.prototype
        );
    }
}

export class CannotGenerateFunctionReturnTypeError<
    E extends Error = Error
> extends Error {
    constructor(public error: E) {
        super(`Cannot generate function return type`);
        Object.setPrototypeOf(
            this,
            CannotGenerateFunctionReturnTypeError.prototype
        );
    }
}

export class CannotGenerateEmptyUnionTypeError extends Error {
    constructor() {
        super("Cannot generate empty union type");
        Object.setPrototypeOf(
            this,
            CannotGenerateEmptyUnionTypeError.prototype
        );
    }
}

export class CannotGenerateUnionError extends Error {
    constructor() {
        super("Cannot generate union type");
        Object.setPrototypeOf(this, CannotGenerateUnionError.prototype);
    }
}

export class CannotGenerateTypeError extends Error {
    constructor(public type: unknown) {
        super(`Cannot generate type`);
        Object.setPrototypeOf(this, CannotGenerateTypeError.prototype);
    }
}

export class CannotGenerateFieldError<E extends Error = Error> extends Error {
    constructor(public fieldName: string, public error: E) {
        super(`Cannot generate field "${fieldName}"`);
        Object.setPrototypeOf(this, CannotGenerateFieldError.prototype);
    }
}

export class CannotGenerateTypesError<E extends Error = Error> extends Error {
    constructor(public errors: CannotGenerateInterfaceError<E>[]) {
        super(`Cannot generate ${errors.length} interfaces`);
        Object.setPrototypeOf(this, CannotGenerateTypesError.prototype);
    }
}
