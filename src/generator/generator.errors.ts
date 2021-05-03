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
