import { left, right } from "fp-ts/lib/Either";
import { ReaderEither } from "fp-ts/lib/ReaderEither";

export const sequenceReaderEither = <Env, Left, Right>(
    items: ReaderEither<Env, Left, Right>[]
): ReaderEither<Env, Left[], Right[]> => (env) => {
    const errors: Left[] = [];
    const values: Right[] = [];

    items.forEach((reader) => {
        const either = reader(env);

        if (either._tag === "Left") {
            errors.push(either.left);
        } else {
            values.push(either.right);
        }
    });

    if (errors.length > 0) {
        return left(errors);
    }

    return right(values);
};
