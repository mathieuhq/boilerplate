/**
 * Wraps a promise to return a safe result object instead of throwing
 */
export const safePromise = async <T>(
  promise: Promise<T>,
): Promise<{
  data: T | null;
  error: Error | null;
}> => {
  try {
    const result = await promise;
    return {
      data: result,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Unwraps a safe promise result or throws the error
 */
export const unwrapSafePromise = async <T, E = Error>(
  promise: Promise<{
    data: T | null;
    error: E;
  }>,
): Promise<T> => {
  const { error, data } = await promise;
  if (error) {
    throw error;
  }

  if (data === null) {
    throw new Error("Data is null but no error was provided");
  }

  return data;
};
