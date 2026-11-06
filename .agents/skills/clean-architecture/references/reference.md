# Clean Architecture Reference

## Dependency Flow

```
FRAMEWORKS & DRIVERS (TanStack Start, Vite/Nitro, Drizzle ORM, Better Auth, BullMQ, Redis)
         ↓
INTERFACE ADAPTERS (Controllers, Schemas, Error mappers, CSV columns)
         ↓
APPLICATION LAYER (Use Cases, DTOs, Ports, Jobs, Services)
         ↓
DOMAIN LAYER (Entities, Value Objects, Repository interfaces, Domain errors, Policies)

INFRASTRUCTURE (Repository impls, Adapters, Mappers, Providers) → implements Domain/Application interfaces
```

Features live in `src/features/{auth,user,organization,admin,email,storage,notification,search}`. Cross-feature building blocks live in `src/shared/{domain,application,infrastructure,interface}`.

## Layer Responsibilities

| Layer          | Contains                                                      | Depends On  |
| -------------- | ------------------------------------------------------------- | ----------- |
| Domain         | Entities, VOs, Repository IFs, Domain errors, Policies, Types | Nothing     |
| Application    | Use Cases, DTOs, Ports, `*.jobs.ts`, Services                 | Domain      |
| Infrastructure | Drizzle repos, Cached repos, Adapters, Mappers, Providers     | Domain, App |
| Interface      | Controllers, Zod schemas, Action error mappers                | Application |

## Base Classes

```typescript
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import { AggregateRoot } from "@/shared/domain/aggregate-root.base";
import { Entity } from "@/shared/domain/entity.base";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { HttpError } from "@/shared/domain/errors/http.error";
import { ValueObject } from "@/shared/domain/value-object.base";
```

`IUseCase<TInput, TOutput>` is a type with `execute: (input: TInput) => Promise<Result<TOutput>>`. Use cases declare `implements IUseCase<Input, Output>` and return `Result.ok(value)` or `Result.fail(error)`.

## Shared Ports and Helpers

| Import                                                    | Provides                                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `@/shared/application/ports/audit-log.port`               | `IAuditLogPort` (`record(entry)`), `AuditLogEntry`, `AuditLogMetadata`                               |
| `@/shared/application/ports/cache.port`                   | `ICachePort` (`getOrSet(key, ttlSeconds, load)`, `delete(...keys)`)                                  |
| `@/shared/application/ports/job-queue.port`               | `IJobQueuePort<TJobs>` (`enqueue(job, options)`), `JobRequest`, `JobHandlers`, `JobOptions`          |
| `@/shared/application/cache-keys`                         | `CacheKeys`, `CacheTtl`                                                                              |
| `@/shared/domain/list-query`                              | `ListQuery`, `PaginatedResult`, `toPaginatedResult`, `MAX_EXPORT_ROWS`, `EXPORT_BATCH_SIZE`          |
| `@/shared/application/list-pages`                         | `iterateListPages`, `describeListQuery`                                                              |
| `@/shared/infrastructure/drizzle/drizzle-list-query`      | `toDrizzleListArgs`, `DrizzleListConfig`, `containsInsensitive`, `toDateRangeWhere`, `sortNullsLast` |
| `@/shared/interface/schemas/list-query.schema`            | `createListQuerySchema`, `listFilter`                                                                |
| `@/shared/infrastructure/csv/csv`                         | `createCsvStream`, `csvResponse`, `escapeCsvValue`, `CsvColumn`                                      |
| `@/shared/infrastructure/audit/drizzle-audit-log.adapter` | `DrizzleAuditLogAdapter` (the `IAuditLogPort` implementation)                                        |

## DI Container Methods

`import { container } from "@/shared/infrastructure/di/container"`

| Method                                | Returns                          |
| ------------------------------------- | -------------------------------- |
| `getUserController()`                 | UserController                   |
| `getDataExportController()`           | DataExportController             |
| `getAuthController()`                 | AuthController                   |
| `getSessionController()`              | SessionController                |
| `getImpersonationController()`        | ImpersonationController          |
| `getAdminController()`                | AdminController                  |
| `getEmailController()`                | EmailController                  |
| `getStorageController()`              | StorageController                |
| `getOrganizationController()`         | OrganizationController           |
| `getOrganizationActivityController()` | OrganizationActivityController   |
| `getNotificationController()`         | NotificationController           |
| `getSearchController()`               | SearchController                 |
| `getSearchProviders()`                | `ISearchProvider[]`              |
| `getJobHandlers()`                    | `JobHandlers<AppJobs>`           |
| `getCache()`                          | `ICachePort` (Redis or no-op)    |
| `getDb()` / `getEnv()`                | Drizzle database / validated env |

Controllers are built on each call. Shared dependencies (repositories, adapters, cache, audit log) are private getters memoized with `??=`. Job queues come from the private `getJobQueue<"job.name">()`, which returns a BullMQ adapter when Redis is configured and an inline adapter that runs `getJobHandlers()` otherwise.

## Repository Interface Pattern

Repository interfaces are `type` aliases with property signatures (enforced by `typescript/consistent-type-definitions` and `typescript/method-signature-style`):

```typescript
export type IUserRepository = {
  save: (user: User) => Promise<User>;
  delete: (id: UserId) => Promise<void>;
  findById: (id: UserId) => Promise<User | null>;
  findByEmail: (email: Email) => Promise<User | null>;
  isEmailTaken: (email: Email, excludeUserId?: UserId) => Promise<boolean>;
};
```

List methods take `ListQuery<SortField> & filters` and return `PaginatedResult<T>`; sort fields are a const array in the feature domain (for example `ADMIN_USER_SORT_FIELDS` in `src/features/admin/domain/admin-list.ts`).

## Mapper Pattern

Mappers export plain functions over a `Pick` of the Drizzle row type (`typeof table.$inferSelect`):

```typescript
export function toDomain(raw: UserRecord): User;
export function toPersistence(user: User): UserRecord;
```

## Background Jobs

- Declare payloads in `src/features/{domain}/application/jobs/{domain}.jobs.ts` as a type keyed by `"{domain}.{action}"`.
- Add the type to `AppJobs` in `src/jobs/jobs.ts` and optional cron entries to `jobSchedules`.
- Add a handler calling a controller in `getJobHandlers()`; enqueue from use cases through `IJobQueuePort<Pick<FeatureJobs, "name">>`.
