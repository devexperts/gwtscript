/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { SimplifiedInterface } from "./unifyTypeOrInterface";
import { TypeToGenerate } from "../model";

import { parseTypeNode } from "./parseTypeNode";
import * as ts from "typescript";

import { Option, sequenceArray, map, some } from "fp-ts/Option";
import { ParserConfig } from "./parser.model";
import { pipe } from "fp-ts/lib/function";
import { Either, right } from "fp-ts/lib/Either";
import { sequenceEither } from "@root/utils/sequenceEither";

export const mapSimplifiedInterfaces = (
    interfaces: SimplifiedInterface[],
    checker: ts.TypeChecker,
    config: ParserConfig
): Either<any, readonly TypeToGenerate[]> => {
    return sequenceEither(
        interfaces.map((interface) => {
            return pipe(
                sequenceEither(
                    interface.fields.map(({ name, type, node, userInput }) => {
                        if (userInput) {
                            return right({
                                name,
                                type: userInput,
                            });
                        }
                        return pipe(
                            parseTypeNode(node, checker, type, config, { fieldName: name, location: interface.filePath, typeName: name }),
                            map((value) => ({
                                name,
                                type: value,
                            }))
                        );
                    })
                ),
                map(
                    (value): TypeToGenerate => ({
                        name: node.name,
                        fields: value,
                        sourcePath: node.filePath,
                    })
                )
            );
        })
    );
};
