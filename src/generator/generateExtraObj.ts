import { Either, map } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { ObjectType } from "../model";
import { generateExtraType } from "./generateExtraType";
import { GeneratorConfig } from "./generator.config";
import { FieldsGeneratingError } from "./generator.errors";

export type ExtraObject = {
    content: string;
    name: string;
    path: string;
    type: ObjectType;
};

export const generateExtraObj = (
    name: string,
    pack: string,
    path: string,
    obj: ObjectType,
    config: GeneratorConfig,
    generateRef: (name: string, type: ObjectType) => { name: string }
): Either<FieldsGeneratingError, ExtraObject> => {
    return pipe(
        generateExtraType(name, pack, obj, config, generateRef),
        map((content) => ({
            content,
            name,
            path,
            type: obj,
        }))
    );
};
