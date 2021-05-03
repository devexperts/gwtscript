#### Hi there
This is Java-Translate package, tool for TS -> Java translation. It finds marked interfaces, type declarations and translates them into Java classes.

#### Development:
> yarn start:dev

#### Package usage guide
You should import compile() function and run it with config. Following code will find all files matching passed tsconfig, find all interfaces and types with "//@ToJava" comment and generate Java classes in "dist" folder.
```ts
import { compile } from '@dx-private/java-translate';
import { resolve } from 'path';

compile({
    interfacePredicate: /@ToJava/,
    tsconfigAbsolutePath: resolve(__dirname, './tsconfig.json'),
    destinationFolder: "dist",
    rootPackage: "com.devexperts.generated",
    generateFunctionType: (func, stringify) => {
        return {
            result: "JsFunc",
            imports: ["com.stuff.JsFunc"]
        }
    },
    generateArrayType: (arr, stringify) => {
        const type = stringify(arr.type);
        return {
            imports: type.imports,
            result: `Array<${type.result}>`
        }
    }
})
```

#### User Directives
The only way to interact with this lib from project code is directives. Directive is specific code comment with specific syntax.
There are 3 directives:
 - Marking directive, "// @ToJava" by default. Tells translator to take interface or type declaration below and translate it.
 - Ignoring directive, "// @ToJavaIgnore" by default. Tells translator to ignore interface field below.
 - User Input directive, "// @InJava {JavaType} from {import1}, {import2}" by default. Tells translator to not parse interface field type and just take {JavaType} from directive

##### Marking directive
---
```ts
// @ToJava
interface A {
    a: number
    b: string
    c: boolean
}

// @ToJava 
type B = {
    c: {
        a: number
    }
}

// @ToJava
type C = Pick<A, "a" | "b">
```
##### Ignoring directive
---
```ts
// @ToJava
interface A {
    a: number
    b: string
    c: boolean
    // @ToJavaIgnore
    d: SpecificType
}
```
##### User Input directive
---
```ts
// @ToJava
interface A {
    a: number
    // @InJava String
    b: string
    c: boolean
    // @InJava SimpleJavaType<int> from com.all.types.for.u.SimpleJavaType
    d: SpecificType<SpecificTypeA, SpecificTypeB>
    // @InJava MultiImportContainer<MultiImportContent> from com.types.lol.MultiImportContainer, com.dzeta.MultiImportContent
    e: UltraSpecificType
}
```

#### Config fields description

##### tsconfigAbsolutePath
Absolute path to project tsconfig file.
```ts
declare type tsconfigAbsolutePath = string;
```

##### interfacePredicate
Filter (aka selector) (aka predicate) for interfaces and type declarations.
```ts
declare type interfacePredicate = 
    | RegExp
    | (node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration) => boolean
```

##### filePredicate (Optional)
File filter. 
```ts
declare type filePredicate = (fileName: string) => boolean
```

##### ignoreField (Optional)
Ignoring directive predicate function. true = ignore
```ts
declare type ignoreField = 
    | RegExp
    | (field: PropertySignature) => boolean
```

##### inJavaRegExpTest (Optional)
If provided replace "User Input directive" tag with passed RegExp
```ts
declare type inJavaRegExpTest = RegExp
```

##### destinationFolder
Generator destination folder
```ts
declare type destinationFolder = string
```

##### rootPackage
Root package for classes
```ts
declare type destinationFolder = string
```

##### generateFunctionType
Configures function field generation. Takes FunctionType, abstracted TS AST functional node, and stringifier() function, common stringifier for nested types.
```ts
declare type generateFunctionType = (
        type: FunctionType,
        stringifyParsedType: (
            type: ParsedType
        ) => { result: string; imports: string[] }
    ) => {
        result: string;
        imports: string[];
    }
```

Example:
```ts
const generateFunctionType = (func: FunctionType, stringify: (type: ParsedType) => { result: string, imports: string[] }) => {
    if (
        func.type.type === "VOID"
    ) {
        return {
            result: `Action${
                func.parameters.length
            }<${func.parameters
                .map((param) => stringify(param).result)
                .join(", ")}>`,
            imports: [
                `com.github.timofeevda.gwt.rxjs.interop.functions.Action${func.parameters.length}`,
            ],
        };
    }
    return {
        result: `Func${
            func.parameters.length
        }<${func.parameters
            .map((param) => stringify(param).result)
            .join(", ")}, ${stringify(func.type).result}>`,
        imports: [
            `com.github.timofeevda.gwt.rxjs.interop.functions.Func${func.parameters.length}`,
        ],
    };
}
```

##### generateArrayType
Array type generator (same with generateFunctionType)
```ts
declare type generateArrayType = (
    type: ArrayType,
    stringifyParsedType: (
        type: ParsedType
    ) => { result: string; imports: string[] }
) => {
    result: string;
    imports: string[];
}
```
Example: 
```ts
const generateArrayType = (arr: ArrayType, stringify: (type: ParsedType) => { result: string, imports: string[] }) => {
    const type = stringify(arr.type);
    return {
        imports: ["com.devexperts.client.reusable.core.list.JsList"].concat(type.imports),
        result: `JsList<${type.result}>`
    }
}
```

##### primitiveMapping (Optional)
Mapping for primitives telling generator how to translate NUMBER, STRING, BOOLEAN, ANY types.
Example:
```ts
const primitiveMapping = {
    BOOLEAN: {
        result: "JsBool",
        imports: ["com.devexperts.client.reusable.core.JsBool"],
    },
    NUMBER: {
        result: "JsDouble",
        imports: ["com.devexperts.client.reusable.core.JsDouble"],
    },
    STRING: {
        result: "JsEnum",
        imports: ["com.devexperts.client.reusable.core.JsEnum"],
    },
    ANY: {
        result: "Object",
        imports: []
    }
}
```

##### nativeReferencesMap (Optional)
Mapping for types that should be converted in specific way. If you have type equivalents in both languages, rxjs Observable for example, you should enter this name in config.
Example: 
```ts
const nativeReferencesMap = {
    Bus: {
        import: "com.specific",
        text: "FEEventBus"
    },
    NewsSource: {
        import: "com.specific",
        text: "NewsSource"
    },
    Observable: {
        import: "com.rxjs.Observable",
        text: "Observable"
    }
}
```

##### getGroupName (Optional)
Sort generator output in folders by type info. Function should return folder name
```ts
interface TypeToGenerate {
    name: string;
    fields: readonly TypeField[];
    sourcePath: string;
}

declare type getGroupName = (type: TypeToGenerate) => string
```