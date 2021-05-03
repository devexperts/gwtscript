import {
    defaultFieldPredicate,
    defaultInterfacePredicate,
} from "../../utils/defaultPredicates";
import { ParserConfig } from "../parser.model";

export const testConfig: ParserConfig = {
    inJavaRegExpTest: /@InJava/,
    interfacePredicate: defaultInterfacePredicate(/@ToJava/),
    nativeReferences: [],
    tsconfigAbsolutePath: "",
    ignoreField: defaultFieldPredicate(/@Ignore/),
};
