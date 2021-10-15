/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

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
