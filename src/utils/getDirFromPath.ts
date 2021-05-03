export const getDirFromPath = (tsconfigPath: string): string => {
    const reversed = tsconfigPath.split("").reverse().join("");
    const index = reversed.indexOf("/");

    const dirName = reversed.slice(index).split("").reverse().join("");

    return dirName;
};
