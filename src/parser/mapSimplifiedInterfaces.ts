/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { pipe } from "fp-ts/lib/function";
import { Either, right, map, mapLeft } from "fp-ts/lib/Either";

import { sequenceEither } from "@root/utils/sequenceEither";

import { parseTypeNode, ParseTypeNodeError } from "./parseTypeNode";
import { ParserConfig } from "./parser.model";
import { SimplifiedInterface } from "./unifyTypeOrInterface";
import { TypeToGenerate } from "../model";
import {
    FailedToParseInterface,
    FailedToParseInterfaceFieldError,
    MapSimplifiedInterfacesError,
} from "./parser.errors";

export const mapSimplifiedInterfaces = (
    interfaces: SimplifiedInterface[],
    checker: ts.TypeChecker,
    config: ParserConfig
): Either<
    MapSimplifiedInterfacesError<FailedToParseInterface<ParseTypeNodeError>>,
    readonly TypeToGenerate[]
> => {
    return pipe(
        sequenceEither(
            interfaces.map((entity) => {
                return pipe(
                    sequenceEither(
                        entity.fields.map(({ name, type, node, userInput }) => {
                            if (userInput) {
                                return right({
                                    name,
                                    type: userInput,
                                });
                            }
                            return pipe(
                                {
                                    fieldName: name,
                                    typeName: entity.name,
                                    location: entity.filePath,
                                },
                                parseTypeNode(node, checker, type, config),
                                map((value) => ({
                                    name,
                                    type: value,
                                })),
                                mapLeft((e) => {
                                    return new FailedToParseInterfaceFieldError(
                                        entity.name,
                                        name,
                                        entity.filePath,
                                        e
                                    );
                                })
                            );
                        })
                    ),
                    map(
                        (value): TypeToGenerate => ({
                            name: entity.name,
                            fields: value,
                            sourcePath: entity.filePath,
                        })
                    ),
                    mapLeft(
                        (e) =>
                            new FailedToParseInterface(
                                entity.name,
                                entity.filePath,
                                e
                            )
                    )
                );
            })
        ),
        mapLeft((e) => new MapSimplifiedInterfacesError(e))
    );
};
