export class Result<T> {
  private readonly _isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: Error;

  private constructor(isSuccess: boolean, value?: T, error?: Error) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess)
      throw new Error("Cannot get value from failed result");

    return this._value as T;
  }

  get error(): Error {
    if (this._isSuccess)
      throw new Error("Cannot get error from successful result");

    return this._error as Error;
  }

  unwrap(): T {
    if (!this._isSuccess) throw this._error as Error;

    return this._value as T;
  }

  static ok<T>(value: T): Result<T> {
    return new Result<T>(true, value);
  }

  static fail<T>(error: Error): Result<T> {
    return new Result<T>(false, undefined, error);
  }
}
