import { open } from "fs/promises";
import * as glob from "glob";

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
*/`);

const run = async (filePattern: string, ignoreFiles: string) => {
    const files = await findFiles(filePattern, ignoreFiles);
    for (const path of files) {
        const file = await open(path, "a+");

        const content = await file.readFile({
            encoding: "utf-8",
        });

        if (content.search(COPYRIGHT_TEXT) === -1) {
            await file.write(
                contentToBuffer,
                contentToBuffer.length,
                contentToBuffer.length,
                0
            );
        }
        file.close();
    }
};

run(FILE_PATTERN, FILE_IGNORE_PATTERN);
