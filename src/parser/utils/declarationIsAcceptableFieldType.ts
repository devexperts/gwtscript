/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { chalk } from "@root/utils/chalk";
import * as ts from "typescript";

export type AcceptableFieldType =
    | ts.PropertySignature
    | ts.MethodSignature
    | ts.PropertyAssignment
    | ts.MethodDeclaration;

export const declarationIsAcceptableFieldType = (
    declaration: ts.Declaration
): declaration is AcceptableFieldType => {
    return ts.isPropertySignature(declaration) ||
        ts.isMethodSignature(declaration) ||
        ts.isPropertyAssignment(declaration) ||
        ts.isMethodDeclaration(declaration)
        ? true
        : (console.log(
              chalk.bgYellow.black(
                  `Unknown field declaration type ${
                      ts.ScriptKind[declaration.kind]
                  }`
              )
          ),
          false);
};
