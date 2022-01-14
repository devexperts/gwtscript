import { GetParsedTypeError } from "@root/parser/getParsedType";
import {
    CannotParseTypeError,
    FailedToParseFunctionParameterError,
    FailedToParseObjectFieldError,
    FailedToParseUnionError,
} from "@root/parser/parser.errors";
import { ParseTypeNodeError } from "@root/parser/parseTypeNode";

import { chalk } from "./chalk";

export const printParseTypeNodeError = (error: ParseTypeNodeError): void => {
    if ("errors" in error) {
        console.log(chalk.bold.red(error.message));
        console.group();
        for (const e of error.errors) {
            if (
                e instanceof FailedToParseFunctionParameterError ||
                e instanceof FailedToParseObjectFieldError
            ) {
                console.log(
                    chalk.red.bold(
                        (e instanceof FailedToParseFunctionParameterError
                            ? e.argName
                            : e.localFieldName) + ":"
                    )
                );
                console.group();
                printParseTypeNodeError(e.error);
                console.groupEnd();
            } else {
                printParseTypeNodeError(e);
            }
        }
        console.groupEnd();
    } else if ("error" in error) {
        console.log(chalk.bold.red(error.message));
        console.group();
        error.error;
        if (error.error instanceof CannotParseTypeError) {
            printParseTypeError(error.error);
        } else if (error.error instanceof FailedToParseUnionError) {
            printParseTypeNodeError(error.error as any);
        } else {
            printParseTypeNodeError(error.error);
        }
        console.groupEnd();
    } else {
        console.log(chalk.bold.red(error.message));
    }
};

export const printParseTypeError = (error: GetParsedTypeError): void => {
    if ("errors" in error) {
        console.log(chalk.red.bold(error.message));
        console.group();
        for (const item of error.errors) {
            printParseTypeError(item);
        }
        console.groupEnd();
    } else {
        console.log(chalk.red.bold(error.message));
    }
};
