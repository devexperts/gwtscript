import { ParsedType, RefableType } from "../model";
import { GeneratorConfig } from "./generator.config";

export interface TransformParsedTypeToString {
    (type: ParsedType, config: GeneratorConfig): {
        result: string;
        imports: string[];
    };
}

export interface GeneratorResult {
    name: string;
    path: string;
    content: string;
}

export type ExtraObject = {
    content: string;
    name: string;
    path: string;
    type: RefableType;
};
