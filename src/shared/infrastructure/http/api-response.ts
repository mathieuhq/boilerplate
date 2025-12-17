import { NextResponse } from "next/server";

import type { HttpStatusCode } from "./http-status";
import { HttpStatus } from "./http-status";

export type ApiSuccessResponse<T> = {
  data: T;
  meta?: ApiResponseMeta;
};

export type ApiResponseMeta = {
  page?: number;
  total?: number;
  limit?: number;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const ApiResponse = {
  success<T>(data: T, status: HttpStatusCode = HttpStatus.OK) {
    return NextResponse.json({ data } satisfies ApiSuccessResponse<T>, {
      status,
    });
  },

  created<T>(data: T) {
    return NextResponse.json({ data } satisfies ApiSuccessResponse<T>, {
      status: HttpStatus.CREATED,
    });
  },

  noContent() {
    return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
  },

  paginated<T>(
    data: T,
    meta: Required<Pick<ApiResponseMeta, "total">> &
      Partial<Pick<ApiResponseMeta, "page" | "limit">>,
  ) {
    return NextResponse.json({ data, meta } satisfies ApiSuccessResponse<T>, {
      status: HttpStatus.OK,
    });
  },

  error(
    code: string,
    message: string,
    status: HttpStatusCode = HttpStatus.BAD_REQUEST,
    details?: unknown,
  ) {
    return NextResponse.json(
      { error: { code, message, details } } satisfies ApiErrorResponse,
      { status },
    );
  },

  badRequest(code: string, message: string, details?: unknown) {
    return ApiResponse.error(code, message, HttpStatus.BAD_REQUEST, details);
  },

  unauthorized(message = "Authentication required") {
    return ApiResponse.error("UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
  },

  forbidden(message = "Access denied") {
    return ApiResponse.error("FORBIDDEN", message, HttpStatus.FORBIDDEN);
  },

  notFound(resource = "Resource", message?: string) {
    return ApiResponse.error(
      `${resource.toUpperCase().replace(/\s+/g, "_")}_NOT_FOUND`,
      message ?? `${resource} not found`,
      HttpStatus.NOT_FOUND,
    );
  },

  conflict(code: string, message: string) {
    return ApiResponse.error(code, message, HttpStatus.CONFLICT);
  },

  validationError(message: string, details?: unknown) {
    return ApiResponse.error(
      "VALIDATION_ERROR",
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      details,
    );
  },

  internalError(message = "An unexpected error occurred") {
    return ApiResponse.error(
      "INTERNAL_ERROR",
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  },
};

export type ActionSuccessResponse<T> = {
  data: T;
};

export type ActionErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ActionResponse<T> = ActionSuccessResponse<T> | ActionErrorResponse;

export const ActionResponse = {
  success<T>(data: T): ActionSuccessResponse<T> {
    return { data };
  },

  error(code: string, message: string, details?: unknown): ActionErrorResponse {
    return { error: { code, message, details } };
  },
};

export function isActionError<T>(
  response: ActionResponse<T>,
): response is ActionErrorResponse {
  return "error" in response;
}

export function isActionSuccess<T>(
  response: ActionResponse<T>,
): response is ActionSuccessResponse<T> {
  return "data" in response;
}
