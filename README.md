#### Hi there
This is GWTScript, tool for TS -> Java translation. It finds marked interfaces, type declarations and translates them into Java classes.

#### Development:
> yarn start:dev


#### Table of content
 - [Package usage guide](#package-usage-guide)
 - [User directives](#user-directives)
    - [Marking directive](#marking-directive)
    - [Ignoring directive](#ignoring-directive)
    - [User input directive](#user-input-directive)
 - [Config fields description](#config-fields-description)
    - [tsconfigAbsolutePath](#tsconfigabsolutepath)
    - [interfacePredicate](#interfacepredicate)
    - [filePredicate](#filepredicate-optional)
    - [ignoreField](#ignorefield-optional)
    - [inJavaRegExpTest](#injavaregexptest-optional)
    - [destinationFolder](#destinationfolder)
    - [rootPackage](#rootpackage)
    - [generateFunctionType](#generatefunctiontype)
    - [generateArrayType](#generatearraytype)
    - [primitiveMapping](#primitivemapping-optional)
    - [nativeReferencesMap](#nativereferencesmap-optional)
    - [getGroupName](#getgroupname-optional)
 - [Custom generator](#custom-generator)


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
    generateFunctionType: (parameters, result) => {
        return {
            result: `JsFunc<${result}>`,
            imports: ["com.stuff.JsFunc"]
        }
    },
    generateArrayType: (type) => {
        return {
            imports: [],
            result: `Array<${type}>`
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
Configures function field generation. Receives parameters and return type.
```ts
declare type generateFunctionType = (
        parameters: Array<{ name: string, type: string }>,
        returnType: string
    ) => {
        result: string;
        imports: string[];
    }
```

Example:
```ts
const generateFunctionType = (parameters: Array<{ name: string, type: string }>, returnType: string) => {
    if (
        returnType === "void"
    ) {
        return {
            result: `Action${
                parameters.length
            }<${parameters
                .map((param) => param.type)
                .join(", ")}>`,
            imports: [
                `com.github.timofeevda.gwt.rxjs.interop.functions.Action${parameters.length}`,
            ],
        };
    }
    return {
        result: `Func${
            parameters.length
        }<${func.parameters
            .map((param) => param.type)
            .join(", ")}, ${returnType}>`,
        imports: [
            `com.github.timofeevda.gwt.rxjs.interop.functions.Func${parameters.length}`,
        ],
    };
}
```

##### generateArrayType
Array type generator (same with generateFunctionType)
```ts
declare type generateArrayType = (
    type: string,
) => {
    result: string;
    imports: string[];
}
```
Example: 
```ts
const generateArrayType = (type: string) => {
    return {
        imports: ["com.devexperts.client.reusable.core.list.JsList"],
        result: `JsList<${type}>`
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


#### Custom generator
This feature allows you to generate your own output instead of default Java GWT classes. Basically custom generator is just a function receiving parser output, so you can use it not only for code generation but just to take a look or experiments. 

##### Usage
When you use a custom generator it is no longer necessary to provide basic generator config fields so the config type changes while you use a custom generator.
```ts
compile(
    {
        interfacePredicate: /@ToTranslate/,
        tsconfigAbsolutePath: resolve(__dirname, './tsconfig.json'),
    },
    (parsed: ParserOutput) => {
        // Our code
    }
)
```
Generator function should be passed as a second argument to compile() function and so you can use parser output. 
The types of nodes provided by Parser Output are described below.

```ts
interface ParserOutput {
    typesToGenerate: readonly TypeToGenerate[];
}

// Marked type
interface TypeToGenerate {
    name: string;
    fields: readonly TypeField[];
    sourcePath: string;
}

interface TypeField {
    name: string;
    type: ParsedType;
}

type ParsedType =
    | PrimitiveType
    | FunctionType
    | ObjectType
    | ArrayType
    | UnionType
    | ReferenceType
    | UserType
    | NumberLiteral
    | StringLiteral;

// Basic class for types
abstract class Type<ID, T> {
    public abstract identifier: ID;
    constructor(public type: T) {}
}

/*
    Literals like "string literal" or just 4
    type A = {
        stringLiteral: "str"
        numberLiteral: 4
    }
*/
class Literal<T extends number | string> extends Type<"literal", T> {
    identifier: "literal" = "literal";
}

class NumberLiteral extends Literal<number> {}

class StringLiteral extends Literal<string> {}

// parser only supports this primitives
type PrimitiveTypes = {
    NUMBER: true;
    STRING: true;
    BOOLEAN: true;
    VOID: true;
    ANY: true;
};

class PrimitiveType extends Type<"primitive", keyof PrimitiveTypes> {
    identifier: "primitive" = "primitive";
}

// "type" argument here is the return type
class FunctionType extends Type<"function", ParsedType> {
    identifier: "function" = "function";

    constructor(
        type: ParsedType,
        public parameters: ReadonlyArray<{ name: string; type: ParsedType }>
    ) {
        super(type);
    }
}

class ObjectType extends Type<
    "object",
    ReadonlyArray<{ name: string; type: ParsedType }>
> {
    identifier: "object" = "object";
    constructor(
        value: ReadonlyArray<{ name: string; type: ParsedType }>
    ) {
        super(value);
    }
}

class ArrayType extends Type<"array", ParsedType> {
    identifier: "array" = "array";
}


class UnionType<T extends ParsedType = ParsedType> extends Type<
    "union",
    readonly T[]
> {
    identifier: "union" = "union";
}


class ReferenceType extends Type<
    "reference",
    { typeName: string; genericArgs: readonly ParsedType[] }
> {
    identifier: "reference" = "reference";
}

// The type you get when use User Input directive
class UserType extends Type<
    "hard-coded-type",
    { text: string; imports: string[] }
> {
    identifier: "hard-coded-type" = "hard-coded-type";
}
```