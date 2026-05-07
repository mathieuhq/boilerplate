# Conventions Examples

## Component Export: Correct vs Incorrect

### Correct: Arrow function with export const

```tsx
// components/ui/button.tsx
export const Button = ({ children, variant = "default" }: ButtonProps) => {
  return <button className={buttonVariants({ variant })}>{children}</button>;
};
```

### Incorrect: Function declaration for components

```tsx
// DON'T DO THIS
export function Button({ children, variant = "default" }: ButtonProps) {
  return <button className={buttonVariants({ variant })}>{children}</button>;
}
```

## Function Export: Correct vs Incorrect

### Correct: Function declaration

```typescript
// lib/utils.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Incorrect: Arrow function for utilities

```typescript
// DON'T DO THIS
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
```

## Import Organization Example

```typescript
// Correct import order
import { useState, useCallback } from "react";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { container } from "@/shared/infrastructure/di/container";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import Link, { useRouter } from "@/lib/navigation";
import { updateUserAction } from "@/server-functions/user.functions";

import { ProfileAvatar } from "./profile-avatar";
import type { ProfileFormProps } from "./types";
```

## File Naming Examples

```
src/features/user/
├── domain/
│   ├── entities/
│   │   └── user.entity.ts              ✓ {name}.entity.ts
│   ├── value-objects/
│   │   ├── email.value-object.ts       ✓ {name}.value-object.ts
│   │   └── user-id.value-object.ts     ✓ {name}.value-object.ts
│   ├── repositories/
│   │   └── user.repository.interface.ts ✓ {name}.repository.interface.ts
│   └── errors/
│       └── user-not-found.error.ts     ✓ {name}.error.ts
├── application/
│   ├── use-cases/
│   │   ├── update-user-profile.use-case.ts  ✓ {verb}-{noun}.use-case.ts
│   │   └── get-current-user.use-case.ts     ✓ {verb}-{noun}.use-case.ts
│   └── dto/
│       └── user-response.dto.ts        ✓ {name}.dto.ts
├── infrastructure/
│   ├── repositories/
│   │   └── prisma-user.repository.ts   ✓ prisma-{name}.repository.ts
│   └── mappers/
│       └── prisma-user.mapper.ts       ✓ prisma-{name}.mapper.ts
└── interface/
    ├── controllers/
    │   └── user.controller.ts          ✓ {domain}.controller.ts
    └── schemas/
        └── user.schema.ts              ✓ {domain}.schema.ts
```
