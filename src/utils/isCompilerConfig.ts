import { CompilerConfig } from "@root/model";

export const isCompilerConfig = (t: unknown): t is CompilerConfig => {
    return typeof t === "object" && t !== null && "destinationFolder" in t;
};
