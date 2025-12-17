import type { Result } from "./result";

export type IUseCase<TInput, TOutput> = {
  execute: (input: TInput) => Promise<Result<TOutput>>;
};
