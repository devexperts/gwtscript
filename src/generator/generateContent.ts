import { Either, map, mapLeft } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { RefableType, TypeToGenerate } from "../model";
import { sequenceEither } from "../utils/sequenceEither";
import { GeneratorConfig } from "./generator.config";
import { FieldsGeneratingError } from "./generator.errors";
import { typeToString } from "./typeToString";

export const generateContent = (
    type: TypeToGenerate,
    pack: string,
    config: GeneratorConfig,
    generateRef: (name: string, type: RefableType) => { name: string }
): Either<FieldsGeneratingError, string> => {
    return pipe(
        sequenceEither(
            type.fields.map((val) => {
                return pipe(
                    typeToString(val.type, config, (f) =>
                        generateRef(val.name, f)
                    ),
                    map((str) => ({
                        ...str,
                        name: val.name,
                    }))
                );
            })
        ),
        map((types) => {
            const imports = new Set([
                "jsinterop.annotations.JsPackage",
                "jsinterop.annotations.JsType",
                "gwt.react.client.proptypes.BaseProps",
            ]);

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
        }),
        map(({ imports, fields }) => {
            return `package ${pack};

${imports.map((i) => `import ${i};`).join(`
`)}


@JsType(isNative = true, namespace = JsPackage.GLOBAL, name = "Object")
public class ${type.name} extends BaseProps {
    ${fields.map((field) => {
        return `public ${field.type} ${field.name};`;
    }).join(`
    `)}
}
`;
        }),
        mapLeft((errors) => {
            return new FieldsGeneratingError(type.name, errors);
        })
    );
};
