import { Either, flatten, map } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { resolve } from "path";
import { ObjectType, TypeToGenerate } from "../model";
import { unEither } from "../utils/unEither";
import { generateContent } from "./generateContent";
import { generateExtraObj, ExtraObject } from "./generateExtraObj";
import { GeneratorConfig } from "./generator.config";
import { FieldsGeneratingError } from "./generator.errors";
import { GeneratorResult } from "./model";

export const generateType = (
    type: TypeToGenerate,
    config: GeneratorConfig
): Either<FieldsGeneratingError, GeneratorResult[]> => {
    return flatten(
        unEither(
            generateExtraObj,
            {
                content: "ErrorContent",
                name: "Error",
                path: "Error",
                type: new ObjectType([]),
            },
            (unEithered) => {
                const group = config.getGroupName
                    ? config.getGroupName(type)
                    : "";
                const folderPath = resolve(
                    config.destinationFolder,
                    group,
                    `${type.name.toLowerCase()}/`
                );
                const packageName = `${config.rootPackage}${
                    group ? `.${group}` : ""
                }.${type.name.toLowerCase()}`;

                const extraTypes = new Map<string, ExtraObject>();
                const handleRef = (name: string, obj: ObjectType) => {
                    const extraName =
                        obj.nameNotation ?? `${type.name}_${name}`;
                    if (!extraTypes.has(extraName)) {
                        extraTypes.set(
                            extraName,
                            unEithered(
                                extraName,
                                packageName,
                                resolve(folderPath, `${extraName}.java`),
                                obj,
                                config,
                                handleRef
                            )
                        );
                    }
                    const val = extraTypes.get(extraName);
                    return {
                        name: val.name,
                    };
                };

                return pipe(
                    generateContent(type, packageName, config, handleRef),
                    map((content) =>
                        [
                            {
                                content,
                                name: type.name,
                                path: resolve(folderPath, `${type.name}.java`),
                            },
                        ].concat(
                            Array.from(extraTypes.values()).map((item) => ({
                                name: item.name,
                                content: item.content,
                                path: item.path,
                            }))
                        )
                    )
                );
            }
        )
    );
};
