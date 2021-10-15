import { none, Option, some } from "fp-ts/lib/Option";
import { PropertyName } from "typescript";

export class CannotGetEscapedTextError extends Error {
    constructor(
        public target: PropertyName
    ){
        super('Cannot get escapedName')
    }
}

export const getEscapedText = (name: PropertyName): Option<string> => {
    if("escapedText" in name) {
        return some(name.escapedText.toString())
    }
    return none
}