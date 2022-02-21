/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { CompilerConfig } from "@root/model";

export const isCompilerConfig = (t: unknown): t is CompilerConfig => {
    return typeof t === "object" && t !== null && "destinationFolder" in t;
};
