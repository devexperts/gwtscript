/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { TypeToStringError } from "@root/generator/typeToString";

import { chalk } from "./chalk";

export const printTypeToStringError = (error: TypeToStringError): void => {
    console.log(chalk.bold.red(error.message));
    if ("errors" in error) {
        console.group();
        for (const item of error.errors) {
            printTypeToStringError(item);
        }
        console.groupEnd();
    } else if ("error" in error) {
        printTypeToStringError(error.error);
    }
};
