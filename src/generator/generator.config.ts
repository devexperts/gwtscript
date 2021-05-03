import {
    ArrayType,
    FunctionType,
    ParsedType,
    PrimitiveTypes,
    TypeToGenerate,
} from "../model";

export interface GeneratorConfig {
    destinationFolder: string;
    rootPackage: string;
    generateFunctionType: (
        type: FunctionType,
        stringifyParsedType: (
            type: ParsedType
        ) => { result: string; imports: string[] }
    ) => {
        result: string;
        imports: string[];
    };
    primitiveMapping?: {
        [key in keyof Omit<PrimitiveTypes, "NULL" | "UNDEFINED">]?: {
            result: string;
            imports: string[];
        };
    };
    getGroupName?: (type: TypeToGenerate) => string;
    generateArrayType: (
        type: ArrayType,
        stringifyParsedType: (
            type: ParsedType
        ) => { result: string; imports: string[] }
    ) => {
        result: string;
        imports: string[];
    };
    nativeReferencesMap: Record<string, { text: string; import: string }>;
}
