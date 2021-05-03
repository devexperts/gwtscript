import {
    getLeadingCommentRanges,
    PropertySignature,
    InterfaceDeclaration,
} from "typescript";

export const defaultFieldPredicate = (reg: RegExp) => (
    node: PropertySignature
): boolean => {
    const commentRanges = getLeadingCommentRanges(node.getFullText(), 0);

    if (!commentRanges?.length) return false;

    let isIgnored = false;

    for (const range of commentRanges) {
        const comment = node.getFullText().slice(range.pos, range.end);
        if (comment.search(reg) !== -1) {
            isIgnored = true;
            break;
        }
    }

    if (!isIgnored) return false;

    return true;
};

export const defaultInterfacePredicate = (reg: RegExp) => (
    node: InterfaceDeclaration
): boolean => {
    const commentRanges = getLeadingCommentRanges(node.getFullText(), 0);

    if (!commentRanges?.length) return false;

    let toExport = false;

    for (const range of commentRanges) {
        const comment = node.getFullText().slice(range.pos, range.end);
        if (comment.search(reg) !== -1) {
            toExport = true;
            break;
        }
    }

    if (!toExport) return false;

    return true;
};
