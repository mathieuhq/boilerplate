# Conventions Examples

## Component Export: Correct vs Incorrect

### Correct: Arrow function with export const

From `components/features/changelog/changelog-type-badge.tsx`:

```tsx
export const ChangelogTypeBadge = ({
  type,
  className,
}: ChangelogTypeBadgeProps) => {
  const t = useTranslations("changelog");

  return (
    <Badge variant="outline" className={cn(typeStyles[type], className)}>
      {t(typeTranslationKeys[type])}
    </Badge>
  );
};
```

### Incorrect: Function declaration for feature components

```tsx
export function ChangelogTypeBadge({
  type,
  className,
}: ChangelogTypeBadgeProps) {
  const t = useTranslations("changelog");

  return (
    <Badge variant="outline" className={cn(typeStyles[type], className)}>
      {t(typeTranslationKeys[type])}
    </Badge>
  );
}
```

shadcn primitives in `components/ui/` keep their upstream `function Button() {}` plus `export { Button, buttonVariants }` style; do not rewrite them.

## Function Export: Correct vs Incorrect

### Correct: Function declaration

From `lib/utils.ts`:

```typescript
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
```

### Incorrect: Arrow function for utilities

```typescript
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
```

## Type Declarations: Correct vs Incorrect

### Correct: Type alias with property signatures

```typescript
export type IAuditLogPort = {
  record: (entry: AuditLogEntry) => Promise<void>;
};
```

### Incorrect: Interface with method signatures

```typescript
export interface IAuditLogPort {
  record(entry: AuditLogEntry): Promise<void>;
}
```

## Import Organization Example

From `components/features/dashboard/form/profile-form.tsx` (trimmed):

```typescript
import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { languageLabels } from "@/features/user/interface/schemas/user.schema";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { updateUserAction } from "@/server-functions/user.functions";
import type { AuthUser } from "@/types/auth-user";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormButton } from "../../form/form-button";

import { AvatarForm } from "./avatar-form";
```

## File Naming Examples

```
src/features/user/
├── domain/
│   ├── data-export.policy.ts               ✓ {name}.policy.ts
│   ├── entities/
│   │   ├── user.entity.ts                  ✓ {name}.entity.ts
│   │   └── user.types.ts                   ✓ {name}.types.ts
│   ├── value-objects/
│   │   ├── email.value-object.ts           ✓ {name}.value-object.ts
│   │   └── user-id.value-object.ts         ✓ {name}.value-object.ts
│   ├── repositories/
│   │   └── user.repository.interface.ts    ✓ {name}.repository.interface.ts
│   ├── errors/
│   │   └── user-not-found.error.ts         ✓ {name}.error.ts
│   └── __tests__/
│       └── email.value-object.test.ts      ✓ {file under test}.test.ts
├── application/
│   ├── use-cases/
│   │   ├── update-user-profile.use-case.ts ✓ {verb}-{noun}.use-case.ts
│   │   └── request-data-export.use-case.ts ✓ {verb}-{noun}.use-case.ts
│   ├── dto/
│   │   └── user-response.dto.ts            ✓ {name}.dto.ts
│   ├── ports/
│   │   └── data-export-storage.port.ts     ✓ {name}.port.ts
│   └── jobs/
│       └── user.jobs.ts                    ✓ {domain}.jobs.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── drizzle-user.repository.ts      ✓ drizzle-{name}.repository.ts
│   │   └── cached-user.repository.ts       ✓ cached-{name}.repository.ts
│   ├── adapters/
│   │   └── fflate-archive.adapter.ts       ✓ {provider}-{name}.adapter.ts
│   └── mappers/
│       └── drizzle-user.mapper.ts          ✓ drizzle-{name}.mapper.ts
└── interface/
    ├── controllers/
    │   ├── user.controller.ts              ✓ {name}.controller.ts
    │   └── data-export.controller.ts       ✓ {name}.controller.ts
    ├── errors/
    │   └── data-export-error.mapper.ts     ✓ {name}-error.mapper.ts
    └── schemas/
        └── user.schema.ts                  ✓ {name}.schema.ts
```
