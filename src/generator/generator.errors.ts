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
    }
}

export class ReferenceTypeGenericError extends Error {
    constructor(
        public typeName: string,
        public errors: Error[],
        public type: ReferenceType
    ) {
        super(`Error with ${typeName}`);
    }
}

export class FieldsGeneratingError extends Error {
    constructor(
        public typeName: string,
        public fieldErrors: Array<ReferenceTypeGenericError | Error>
    ) {
        super(`Generating fields error in type "${typeName}"`);
    }
}

export class FailedToGenerateFieldsOnTypes extends Error {
    constructor(public errors: FieldsGeneratingError[]) {
        super(`Failed to generate ${errors.length} types`);
    }
}
