import * as ts from "typescript";

export const TAKE = Symbol("Take");

export type Ast<Type extends ts.Statement> = {
    source: string;
    ast: Type;
    file: ts.SourceFile;
};

export const ast = <Type extends ts.Statement>(
    predicate: (node: ts.Statement) => node is Type
) => (strings: TemplateStringsArray, mark?: typeof TAKE) => (
    name: string
): Ast<Type> => {
    const source = strings.join(
        mark
            ? `// TAKE_THIS
    `
            : ""
    );
    const file = ts.createSourceFile(name, source, ts.ScriptTarget.ES2015);

    const ast = !mark
        ? file.statements[0]
        : file.statements.find((st) => {
              const text = file.text.slice(st.pos, st.end);
              const ranges = ts.getLeadingCommentRanges(text, 0);
              if (!ranges) return false;
              return Boolean(
                  ranges.find((range) => {
                      const comment = text.slice(range.pos, range.end);
                      if (comment.includes("// TAKE_THIS")) return true;
                  })
              );
          });

    if (predicate(ast)) {
        return {
            file,
            source,
            ast,
        };
    }

    throw new Error("Predicate failed");
};

export const ifc = ast((node): node is ts.InterfaceDeclaration =>
    ts.isInterfaceDeclaration(node)
);

export const td = ast((node): node is ts.TypeAliasDeclaration =>
    ts.isTypeAliasDeclaration(node)
);
