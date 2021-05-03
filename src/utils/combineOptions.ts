import { Option, ap, map } from "fp-ts/Option";

export const combineOptions = <A, B, Result>(
    a: Option<A>,
    b: Option<B>,
    mapper: (a: A, b: B) => Result
): Option<Result> => {
    return ap(a)(map((valueB: B) => (valueA: A) => mapper(valueA, valueB))(b));
};
