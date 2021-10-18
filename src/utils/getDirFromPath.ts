/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

export const getDirFromPath = (tsconfigPath: string): string => {
    const reversed = tsconfigPath.split("").reverse().join("");
    const index = reversed.indexOf("/");

    const dirName = reversed.slice(index).split("").reverse().join("");

    return dirName;
};
