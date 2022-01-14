import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { mapLeft, ReaderEither } from "fp-ts/lib/ReaderEither";

import { joinLeftReader } from "./joinLeftReader";

export const chainLeftReader = <E, L, R>(mapper: (e: E) => Either<L, R>) => <
    Env,
    Right
>(
    readerEither: ReaderEither<Env, E, Right>
): ReaderEither<Env, L | R, Right> => {
    return pipe(readerEither, mapLeft(mapper), joinLeftReader);
};
