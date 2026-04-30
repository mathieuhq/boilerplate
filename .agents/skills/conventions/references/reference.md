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
| Adapter              | `{provider}.adapter.ts`          | `resend.adapter.ts`               |
| Controller           | `{domain}.controller.ts`         | `user.controller.ts`              |
| Mapper               | `prisma-{name}.mapper.ts`        | `prisma-user.mapper.ts`           |
| Schema               | `{domain}.schema.ts`             | `user.schema.ts`                  |
| Error                | `{name}.error.ts`                | `user-not-found.error.ts`         |
| Test                 | `{name}.test.ts`                 | `update-user-profile.test.ts`     |

## Import Order Details

```typescript
// 1. React
import { useState, useEffect } from "react";

// 2. Next.js
import { useRouter } from "next/navigation";
import type { Metadata } from "next";

// 3. External packages
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

// 4. Internal absolute (@/)
import { container } from "@/shared/infrastructure/di/container";
import { Button } from "@/components/ui/button";

// 5. Relative imports
import { UserForm } from "./user-form";
import type { UserProps } from "../types";

// 6. CSS (if any)
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
