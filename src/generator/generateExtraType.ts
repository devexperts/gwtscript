import { Either, map, mapLeft } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { ObjectType, RefableType } from "../model";
import { sequenceEither } from "../utils/sequenceEither";
import { GeneratorConfig } from "./generator.config";
import { FieldsGeneratingError } from "./generator.errors";
import { typeToString } from "./typeToString";

export const generateExtraType = (
    name: string,
    pack: string,
    type: ObjectType,
    config: GeneratorConfig,
    generateRef: (name: string, type: RefableType) => { name: string }
): Either<FieldsGeneratingError, string> => {
    return pipe(
        pipe(
            sequenceEither(
                type.type.map((val) =>
                    pipe(
                        typeToString(val.type, config, (f) =>
                            generateRef(val.name, f)
                        ),
                        map((str) => ({
                            ...str,
                            name: val.name,
                        }))
                    )
                )
            ),
            map((types) => {
                const imports = new Set<string>([]);

                return {
                    fields: types.map((type) => {
                        type.imports.forEach((i) => imports.add(i));
                        return {
                            name: type.name,
                            type: type.result,
                        };
                    }),
                    imports: Array.from(imports),
                };
            })
        ),
        map(({ imports, fields }) => {
            return `package ${pack};

${imports.map((i) => `import ${i};`).join(`
`)}


public class ${name} {
    ${fields.map((field) => {
        return `public ${field.type} ${field.name};`;
    }).join(`
    `)}
}
`;
        }),
        mapLeft((errors) => new FieldsGeneratingError(name, errors))
    );
};
