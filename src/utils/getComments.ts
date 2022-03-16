/*
Copyright (C) 2002 - 2021 Devexperts LLC
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import * as ts from "typescript";
import { none, Option, some } from "fp-ts/lib/Option";

export const getComments = (node: ts.Node): Option<string[]> => {
    const text = node.getFullText();

    const commentRanges = ts.getLeadingCommentRanges(text, 0);

    if (!commentRanges?.length) return none;

    const comments: string[] = [];

    for (const range of commentRanges) {
        switch (range.kind) {
            case 3: {
                comments.push(
                    text.slice(range.pos, range.end).slice(2, -2).trim()
                );
                break;
            }
            default: {
                comments.push(text.slice(range.pos, range.end).slice(2).trim());
                break;
            }
        }
    }

    return some(comments);
};
