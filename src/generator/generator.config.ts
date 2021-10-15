/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

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
