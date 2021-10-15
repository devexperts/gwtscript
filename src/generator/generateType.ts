import { Either, flatten, map } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { resolve } from "path";
import { ObjectType, RefableType, TypeToGenerate } from "../model";
import { unEither } from "../utils/unEither";
import { generateContent } from "./generateContent";
import { generateExtraObj } from "./generateExtraObj";
import { generateUnionType } from "./generateUnionType";
import { GeneratorConfig } from "./generator.config";
import { FieldsGeneratingError } from "./generator.errors";
import { ExtraObject, GeneratorResult } from "./model";

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
                const handleRef = (name: string, toRef: RefableType) => {
                    const extraName =
                        toRef.identifier === "object"
                            ? toRef.nameNotation ?? `${type.name}_${name}`
                            : `${type.name}_${name}`;

                    if (!extraTypes.has(extraName)) {
                        if (toRef.identifier === "object") {
                            extraTypes.set(
                                extraName,
                                unEithered(
                                    extraName,
                                    packageName,
                                    resolve(folderPath, `${extraName}.java`),
                                    toRef,
                                    config,
                                    handleRef
                                )
                            );
                        } else {
                            const content = generateUnionType(
                                extraName,
                                packageName,
                                toRef
                            );
                            extraTypes.set(extraName, {
                                content,
                                name: extraName,
                                path: resolve(folderPath, `${extraName}.java`),
                                type: toRef,
                            });
                        }
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
