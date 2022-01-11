import { ReaderEither } from "fp-ts/lib/ReaderEither";
import { combineEithers } from "./combineEithers";

export const combineReaderEithers = <Env, Left1, Right1, Left2, Right2, Next>(
    reader1: ReaderEither<Env, Left1, Right1>,
    reader2: ReaderEither<Env, Left2, Right2>,
    mapper: (value1: Right1, value2: Right2) => Next
): ReaderEither<Env, Left1 | Left2, Next> => (env) => {
    const either1 = reader1(env);
    const either2 = reader2(env);

    return combineEithers(either1, either2, mapper);
};
