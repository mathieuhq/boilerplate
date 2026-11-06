# Conventions Reference

## File Naming Conventions

| Type                 | Pattern                          | Example                                            |
| -------------------- | -------------------------------- | -------------------------------------------------- |
| Entity               | `{name}.entity.ts`               | `user.entity.ts`                                   |
| Domain types         | `{name}.types.ts`                | `user.types.ts`, `notification.types.ts`           |
| Domain policy        | `{name}.policy.ts`               | `data-export.policy.ts`                            |
| Value Object         | `{name}.value-object.ts`         | `email.value-object.ts`                            |
| Repository Interface | `{name}.repository.interface.ts` | `user.repository.interface.ts`                     |
| Repository Impl      | `prisma-{name}.repository.ts`    | `prisma-user.repository.ts`                        |
| Cached Repository    | `cached-{name}.repository.ts`    | `cached-user.repository.ts`                        |
| Use Case             | `{verb}-{noun}.use-case.ts`      | `update-user-profile.use-case.ts`                  |
| DTO                  | `{name}.dto.ts`                  | `user-response.dto.ts`                             |
| Port                 | `{name}.port.ts`                 | `audit-log.port.ts`                                |
| Job declarations     | `{domain}.jobs.ts`               | `user.jobs.ts`                                     |
| Adapter              | `{provider}-{name}.adapter.ts`   | `resend.adapter.ts`, `prisma-audit-log.adapter.ts` |
| Search provider      | `{name}-search.provider.ts`      | `user-search.provider.ts`                          |
| Controller           | `{name}.controller.ts`           | `user.controller.ts`, `session.controller.ts`      |
| Mapper               | `prisma-{name}.mapper.ts`        | `prisma-user.mapper.ts`                            |
| Action error mapper  | `{name}-error.mapper.ts`         | `session-action-error.mapper.ts`                   |
| Schema               | `{name}.schema.ts`               | `user.schema.ts`, `list-query.schema.ts`           |
| Error                | `{name}.error.ts`                | `user-not-found.error.ts`                          |
| Server functions     | `{domain}.functions.ts`          | `user.functions.ts`                                |
| MCP tools            | `{domain}.tools.ts`              | `user.tools.ts`                                    |
| Test                 | `{file under test}.test.ts`      | `update-user-profile.use-case.test.ts`             |
| Test double          | `{name}.mock.ts` in `__tests__`  | `session-management.mock.ts`                       |

## Import Order Details

Oxfmt sorts imports (`sortImports` in `.oxfmtrc.json`). React, `@tanstack/*`, and other external packages form one block with no blank lines between them; then come scoped imports (`@/` aliases and `@scope/` packages such as `@hookform/resolvers`), parent (`../`), sibling (`./`), styles, and side-effect imports, each separated by a blank line. Type imports sort with value imports from the same group.

```typescript
import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import { cn } from "@/lib/utils";
import { updateUserAction } from "@/server-functions/user.functions";
import type { AuthUser } from "@/types/auth-user";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormButton } from "../../form/form-button";

import { AvatarForm } from "./avatar-form";
```

## Path Alias Mappings

| Alias                  | Maps To                | Usage                                 |
| ---------------------- | ---------------------- | ------------------------------------- |
| `@/*`                  | root                   | `components`, `lib`, `views`, `hooks` |
| `@/features/*`         | `src/features`         | Domain modules                        |
| `@/shared/*`           | `src/shared`           | Shared base classes, ports, helpers   |
| `@/server-functions/*` | `src/server-functions` | TanStack server functions             |
| `@/jobs/*`             | `src/jobs`             | `AppJobs`, `jobSchedules`, worker     |
| `@/mcp/*`              | `src/mcp`              | MCP server and tools                  |
| `@/i18n`, `@/i18n/*`   | `src/i18n`             | Local i18n facade                     |
| `@/test/*`             | `src/test`             | Test builders and mock factories      |
| `@/lib/env`            | `lib/env/index`        | Validated environment                 |

## Code Style Rules

| Rule             | Value                            |
| ---------------- | -------------------------------- |
| Formatter        | Oxfmt (`pnpm format`)            |
| Linter           | Oxlint, type-aware (`pnpm lint`) |
| Line width       | 80 characters                    |
| Indentation      | 2 spaces                         |
| Semicolons       | Required                         |
| Quotes           | Double                           |
| Arrow parens     | Always                           |
| Trailing commas  | All (formatter default)          |
| Tailwind sorting | Automatic (`sortTailwindcss`)    |
| Comments         | None in code or config files     |

## Lint Rules That Shape Code

| Rule                                     | Effect                                                     |
| ---------------------------------------- | ---------------------------------------------------------- |
| `typescript/consistent-type-definitions` | `type` aliases, never `interface`                          |
| `typescript/method-signature-style`      | Property signatures: `save: (user: User) => Promise<User>` |
| `typescript/consistent-type-imports`     | `import type` for type-only imports                        |
| `typescript/no-explicit-any`             | No `any`                                                   |
| `typescript/no-non-null-assertion`       | No `!` assertions                                          |
| `typescript/prefer-nullish-coalescing`   | `??` over `\|\|` for defaults                              |
| `typescript/promise-function-async`      | Functions returning promises are `async`                   |
| `typescript/no-floating-promises`        | Await or explicitly handle promises                        |
| `no-console`, `no-await-in-loop`         | Use `logger`; batch async work                             |
| `no-unused-vars`                         | Prefix intentionally unused bindings with `_`              |
