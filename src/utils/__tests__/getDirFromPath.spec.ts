import { getDirFromPath } from "../getDirFromPath";

describe("getDirFromPath()", () => {
    it("works", () => {
        expect(getDirFromPath("aa/aa/aa.aa")).toBe("aa/aa/");
        expect(getDirFromPath("aa/aa/aa")).toBe("aa/aa/");
    });
});
