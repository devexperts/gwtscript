import { Either, right, isLeft } from "fp-ts/lib/Either"

export const combineEithers = <AError, A, BError, B, Result>(
    a: Either<AError, A>,
    b: Either<BError, B>,
    mapper: (a: A, b: B) => Result
): Either<AError | BError, Result> => {
    if(isLeft(a)) return a;
    if(isLeft(b)) return b;

    return right(mapper(a.right, b.right))
}