import { open } from "fs/promises";
import * as glob from "glob";
import * as chalk from "chalk";

// --------- CONFIG --------

const FILE_PATTERN = "./src/**/*.ts";
const FILE_IGNORE_PATTERN = "./src/**/__tests__/**/*";

const CHECK_COPYRIGHT_TEXT = "Copyright";
const COPYRIGHT_TEXT = `Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.`;

// --------- HELPERS -------

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

const isFull = <ObjType extends Record<string, string>>(
    check: Partial<ObjType>,
    target: ObjType
): check is ObjType => {
    let checked = 0;

    for (const key in check) {
        if (key in target) {
            checked++;
            continue;
        }
        return false;
    }
    if (checked < Object.keys(target).length) return false;

    return true;
};

const normalizeTexts = <Texts extends Record<string, string>>(
    texts: Texts
): Texts => {
    let maxLength = 0;
    for (const key in texts) {
        if (texts[key].length > maxLength) {
            maxLength = texts[key].length;
        }
    }

    const normalized: Partial<Texts> = {};

    for (const key in texts) {
        const current = texts[key];
        normalized[key] = (new Array(maxLength - current.length)
            .fill(" ")
            .join("") + current) as Texts[Extract<keyof Texts, string>];
    }

    if (isFull(normalized, texts)) {
        return normalized;
    }
    throw new Error();
};

const rows = normalizeTexts({
    added: "copyright added",
    has: "already has copyright",
    pattern: "File Pattern:",
    ignore: "Ignore Pattern:",
    found: "Files found:",
});

// ------ MAIN -------

const run = async (
    filePattern: string,
    ignoreFiles: string,
    checkText: string
) => {
    console.log(chalk.white.bold("Add copyrights script started\n"));
    console.log(
        chalk.black.bgMagenta(rows.pattern),
        chalk.white.bold(filePattern)
    );
    console.log(
        chalk.black.bgMagenta(rows.ignore),
        chalk.white.bold(ignoreFiles)
    );
    const files = await findFiles(filePattern, ignoreFiles);
    console.log(
        chalk.black.bgMagenta(rows.found),
        chalk.white.bold(files.length)
    );
    console.log("");

    let modified = 0;
    let ignored = 0;

    for (const path of files) {
        const file = await open(path, "a+");

        const content = await file.readFile({
            encoding: "utf-8",
        });

        if (content.search(checkText) === -1) {
            modified++;
            await file.write(contentToBuffer, 0, contentToBuffer.length, 0);
            await file.write(
                Buffer.from(content),
                0,
                content.length,
                contentToBuffer.length
            );
            console.log(
                chalk.black.bgGreen.bold(rows.added) +
                    chalk.white.bold(`"${path}"`)
            );
        } else {
            ignored++;
            console.log(
                chalk.black.bgYellow.bold(rows.has) +
                    chalk.white.bold(`"${path}"`)
            );
        }

        file.close();
    }

    console.log(chalk.white.bold("Total"));
    console.log(
        chalk.black.bgGreen(`Modified: ${modified}`),
        chalk.black.bgYellow(`Ignored: ${ignored}`)
    );
};

run(FILE_PATTERN, FILE_IGNORE_PATTERN, CHECK_COPYRIGHT_TEXT);
