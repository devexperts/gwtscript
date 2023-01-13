/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { PropertySignature, InterfaceDeclaration } from "typescript";

import * as array from "fp-ts/lib/Array";
import { constFalse, pipe, flow } from "fp-ts/lib/function";
import * as Option from "fp-ts/lib/Option";

import { getComments } from "./getComments";

export const defaultFieldPredicate = (reg: RegExp) => (
    node: PropertySignature
): boolean => {
    return pipe(
        getComments(node),
        Option.map((lines) => {
            let isIgnored = false;
            for (const line of lines) {
                if (line.search(reg) !== -1) {
                    isIgnored = true;
                    break;
                }
            }

            return isIgnored;
        }),
        Option.getOrElse(constFalse)
    );
};

export const defaultInterfacePredicate = (
    reg: RegExp
): ((node: InterfaceDeclaration) => boolean) =>
    flow(
        getComments,
        Option.chain(array.last),
        Option.map((line) => line.search(reg) !== -1),
        Option.getOrElse(constFalse)
    );
