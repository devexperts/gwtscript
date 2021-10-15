import { open } from "fs/promises";
import * as glob from "glob";
import * as chalk from "chalk";

const FILE_PATTERN = "./src/**/*.ts";
const FILE_IGNORE_PATTERN = "./src/**/__tests__/**/*";

const COPYRIGHT_TEXT = `Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.`;

const findFiles = (pattern: string, ignore: string) =>
    new Promise<string[]>((resolve, reject) => {
        glob(pattern, { ignore }, (err, files) => {
            if (err) reject(err);
            else resolve(files);
        });
    });

const contentToBuffer = Buffer.from(`/*
${COPYRIGHT_TEXT}
*/

`);

const run = async (filePattern: string, ignoreFiles: string) => {
    console.log(chalk.white.bold("Add copyrights script started\n"));
    console.log(
        chalk.black.bgMagenta("File Pattern:"),
        chalk.white.bold(filePattern)
    );
    console.log(
        chalk.black.bgMagenta("Ignore Pattern:"),
        chalk.white.bold(ignoreFiles)
    );
    const files = await findFiles(filePattern, ignoreFiles);
    console.log(
        chalk.black.bgMagenta("Files found:"),
        chalk.white.bold(files.length)
    );

    for (const path of files) {
        const file = await open(path, "a+");

        const content = await file.readFile({
            encoding: "utf-8",
        });

        let modified = 0;
        let ignored = 0;

        if (content.search(COPYRIGHT_TEXT) === -1) {
            modified++;
            await file.write(contentToBuffer, 0, contentToBuffer.length, 0);
            await file.write(
                Buffer.from(content),
                0,
                content.length,
                contentToBuffer.length
            );
            console.log(
                chalk.white.bold(`"${path}"`) +
                    chalk.black.bgGreen.bold("copyright added")
            );
        } else {
            ignored++;
            console.log(
                chalk.white.bold(`"${path}"`) +
                    chalk.black.bgYellow.bold("already has copyright")
            );
        }

        console.log(chalk.white.bold("Total"));
        console.log(
            chalk.black.bgGreen(`Modified: ${modified}`),
            chalk.black.bgYellow(`Ignored: ${ignored}`)
        );

        file.close();
    }
};

run(FILE_PATTERN, FILE_IGNORE_PATTERN);
