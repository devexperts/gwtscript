import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { ReaderEither } from "fp-ts/lib/ReaderEither";

import { joinLeft } from "./joinLeft";

export const joinLeftReader = <E, LL, LR, R>(
    reader: ReaderEither<E, Either<LL, LR>, R>
): ReaderEither<E, LL | LR, R> => (env) => {
    return pipe(env, reader, joinLeft);
};
