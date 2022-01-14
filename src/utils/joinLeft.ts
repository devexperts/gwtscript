import { Either, isRight, left } from "fp-ts/lib/Either";

export const joinLeft = <LL, LR, R>(
    either: Either<Either<LL, LR>, R>
): Either<LL | LR, R> => {
    if (isRight(either)) return either;
    const leftEither = either.left;

    if (isRight(leftEither)) return left(leftEither.right);

    return leftEither;
};
