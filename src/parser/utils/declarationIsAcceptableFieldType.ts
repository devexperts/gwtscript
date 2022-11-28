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
