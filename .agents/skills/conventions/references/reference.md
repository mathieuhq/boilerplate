# Conventions Reference

## File Naming Conventions

| Type                 | Pattern                          | Example                           |
| -------------------- | -------------------------------- | --------------------------------- |
| Entity               | `{name}.entity.ts`               | `user.entity.ts`                  |
| Value Object         | `{name}.value-object.ts`         | `email.value-object.ts`           |
| Repository Interface | `{name}.repository.interface.ts` | `user.repository.interface.ts`    |
| Repository Impl      | `prisma-{name}.repository.ts`    | `prisma-user.repository.ts`       |
| Use Case             | `{verb}-{noun}.use-case.ts`      | `update-user-profile.use-case.ts` |
| DTO                  | `{name}.dto.ts`                  | `user-response.dto.ts`            |
| Port                 | `{name}.port.ts`                 | `email-provider.port.ts`          |
| Adapter              | `{provider}.adapter.ts`          | `plunk.adapter.ts`                |
| Controller           | `{domain}.controller.ts`         | `user.controller.ts`              |
| Mapper               | `prisma-{name}.mapper.ts`        | `prisma-user.mapper.ts`           |
| Schema               | `{domain}.schema.ts`             | `user.schema.ts`                  |
| Error                | `{name}.error.ts`                | `user-not-found.error.ts`         |
| Test                 | `{name}.test.ts`                 | `update-user-profile.test.ts`     |

## Import Order Details

```typescript
// 1. React
import { useState, useEffect } from "react";

// 2. TanStack/external packages
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// 3. Internal absolute (@/)
import { Button } from "@/components/ui/button";
import { container } from "@/shared/infrastructure/di/container";

// 4. Relative imports
import type { UserProps } from "../types";

import { UserForm } from "./user-form";

// 5. CSS (if any)
import "./styles.css";
```

## Path Alias Mappings

| Alias          | Maps To      | Usage                 |
| -------------- | ------------ | --------------------- |
| `@/*`          | root         | General imports       |
| `@/features/*` | src/features | Domain modules        |
| `@/shared/*`   | src/shared   | Shared infrastructure |

## Code Style Rules

| Rule             | Value         |
| ---------------- | ------------- |
| Line width       | 80 characters |
| Indentation      | 2 spaces      |
| Semicolons       | Required      |
| Quotes           | Double        |
| Trailing commas  | ES5           |
| Tailwind sorting | Automatic     |
