import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

const WRITE_OPERATIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
]);

type FieldRefs = Record<string, { typeName?: string } | undefined>;

type WriteArgs = {
  data?: unknown;
  create?: unknown;
  update?: unknown;
};

function getFieldRefs(model: string) {
  const delegate = (
    db as unknown as Partial<Record<string, { fields?: FieldRefs }>>
  )[model.charAt(0).toLowerCase() + model.slice(1)];

  return delegate?.fields;
}

function withDbNullJson(model: string, data: unknown): unknown {
  if (Array.isArray(data))
    return data.map((item) => withDbNullJson(model, item));

  if (!data || typeof data !== "object") return data;

  const fields = getFieldRefs(model);

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === null && fields?.[key]?.typeName === "Json"
        ? Prisma.DbNull
        : value,
    ]),
  );
}

export const authDatabase = db.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!WRITE_OPERATIONS.has(operation)) return query(args);

        const writeArgs = args as WriteArgs;

        return query({
          ...writeArgs,
          ...(writeArgs.data !== undefined && {
            data: withDbNullJson(model, writeArgs.data),
          }),
          ...(writeArgs.create !== undefined && {
            create: withDbNullJson(model, writeArgs.create),
          }),
          ...(writeArgs.update !== undefined && {
            update: withDbNullJson(model, writeArgs.update),
          }),
        } as typeof args);
      },
    },
  },
});
