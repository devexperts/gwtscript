/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as path from "path";

import * as aliases from "module-alias";

aliases.addAliases({
    "@root": path.resolve(__dirname, "./"),
    "@chalk": path.resolve(__dirname, "./utils/chalk"),
});
