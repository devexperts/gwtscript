import {
    InterfaceDeclaration,
    MethodSignature,
    PropertySignature,
    TypeAliasDeclaration,
} from "typescript";

export interface ParserConfig {
    interfacePredicate: (
        node: InterfaceDeclaration | TypeAliasDeclaration
    ) => boolean;
    filePredicate?: (fileName: string) => boolean;
    tsconfigAbsolutePath: string;
    ignoreField?: (field: PropertySignature | MethodSignature) => boolean;
    nativeReferences: string[];
    inJavaRegExpTest: RegExp;
    logs?: boolean;
}
