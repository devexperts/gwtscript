import { Either, isLeft, isRight, left, right } from "fp-ts/lib/Either";

/**
 *
 * @param func function to be un-eithered
 * @param leftValue on-left value
 * @param cb callback with un-eithered function
 * @returns Either with result of cb and error
 *
 * @description use this if u need to use "() => Either<L, R>" function as "() => R" function;
 *
 * @example
 *
 * // program config
 * type Config = {
 *   transformString: (
 *     sliceString: (str: string) => string
 *   ) => string
 * }
 *
 * // sliceString realization
 * const eitherStringSlice = (a: string): Either<Error, string> => {
 *   if(a.length < 3) return left(new Error())
 *   return right(a.slice(2))
 * }
 *
 * export const execute = (config: Config) => {
 *   const str = ["SDasdkaljss", "a"]
 *
 *   const result = unEither(
 *      eitherStringSlice,
 *      "Error",
 *      unEithered => {
 *        return str.map(s => config.transformString(unEithered))
 *      }
 *   )
 *
 *   return result // Either<Error, string[]>
 * }
 *
 */
export const unEither = <L, R, Args extends any[], Result>(
    func: (...args: Args) => Either<L, R>,
    leftValue: R,
    cb: (unEither: (...args: Args) => R) => Result
): Either<L, Result> => {
    let hasError: L | null = null;

    const result = cb((...args) => {
        const either = func(...args);
        if (isRight(either)) return either.right;
        if (isLeft(either)) {
            hasError = either.left;
        }
        return leftValue;
    });

    if (hasError) return left(hasError);
    return right(result);
};
