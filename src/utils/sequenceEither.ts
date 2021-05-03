import { Either, isLeft, isRight, left, right } from "fp-ts/lib/Either";

export const sequenceEither = <L, R>(
    eithers: Either<L, R>[]
): Either<L[], R[]> => {
    const errors: L[] = [];
    const result: R[] = [];

    eithers.forEach((item) => {
        if (isLeft(item)) {
            errors.push(item.left);
        }
        if (isRight(item)) {
            result.push(item.right);
        }
    });

    if (result.length !== eithers.length) return left(errors);

    return right(result);
};
