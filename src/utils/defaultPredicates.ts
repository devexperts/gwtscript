/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { constFalse, pipe } from "fp-ts/lib/function";
import { getOrElse, map } from "fp-ts/lib/Option";
import { PropertySignature, InterfaceDeclaration } from "typescript";

import { getComments } from "./getComments";

export const defaultFieldPredicate = (reg: RegExp) => (
    node: PropertySignature
): boolean => {
    return pipe(
        getComments(node),
        map((lines) => {
            let isIgnored = false;

            for (const line of lines) {
                if (line.search(reg) !== -1) {
                    isIgnored = true;
                    break;
                }
            }

            return isIgnored;
        }),
        getOrElse(constFalse)
    );
};

export const defaultInterfacePredicate = (reg: RegExp) => (
    node: InterfaceDeclaration
): boolean => {
    return pipe(
        getComments(node),
        map((lines) => {
            let toExport = false;
            for (const line of lines) {
                if (line.search(reg) !== -1) {
                    toExport = true;
                    break;
                }
            }

            return toExport;
        }),
        getOrElse(constFalse)
    );
};
