/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import {
    InterfaceDeclaration,
    MethodSignature,
    PropertySignature,
    TypeAliasDeclaration,
} from "typescript";

export interface ParserConfig {
    interfacePredicateRegexp?: RegExp;
    interfacePredicate: (
        node: InterfaceDeclaration | TypeAliasDeclaration
    ) => boolean;
    filePredicate?: (fileName: string) => boolean;
    tsconfigAbsolutePath: string;
    ignoreField?: (field: PropertySignature | MethodSignature) => boolean;
    nativeReferences: string[];
    inJavaRegExpTest: RegExp;
    logs?: boolean;
    disableTypesInErrors?: boolean;
}
