---
name: clean-architecture
description: Clean Architecture domain, application, infrastructure, interface, repository, use case, controller, mapper, Result, port, job, and DI patterns. Use when adding features, entities, value objects, repositories, adapters, ports, use cases, controllers, background jobs, audit logging, or container wiring.
---

# Clean Architecture

## Workflow

- Model business rules in `src/features/{domain}/domain` with entities, value objects, repository interfaces (`type` aliases), policies, and domain errors.
- Put orchestration in application use cases that implement `IUseCase` and return `Result<T>` (`@/shared/application/result`) for expected success/failure.
- Depend on ports for side effects: feature ports in `application/ports/*.port.ts`, shared `IAuditLogPort`, `ICachePort` and `IJobQueuePort` in `src/shared/application/ports`.
- Declare background jobs in `application/jobs/{domain}.jobs.ts`, add them to `AppJobs` (`src/jobs/jobs.ts`), and handle them in `getJobHandlers()`.
- Build paginated lists with the shared list query helpers (`ListQuery`, `toDrizzleListArgs`, `toPaginatedResult`, `iterateListPages`).
- Keep persistence and external providers in infrastructure repositories, adapters, providers, and mappers.
- Expose use cases through interface controllers and Zod schemas; controllers throw `result.error` on failure.
- Wire implementations through `src/shared/infrastructure/di/container` instead of instantiating cross-layer dependencies ad hoc.
- Preserve dependency direction: outer layers depend on inner contracts, never the reverse.

## Resources

- Read [references/reference.md](references/reference.md) for dependency flow, layer responsibilities, base classes, shared ports and helpers, DI methods, repository interfaces, mappers, and jobs.
- Read [references/examples.md](references/examples.md) for entity, value object, use case, audit log and job ports, repository, list repository, mapper, controller, and DI examples.

## Boundaries

- Use `$api-patterns` for route/action placement and response helpers.
- Use `$testing` when adding or updating domain and application tests.
- Use `$error-handling` for error class selection and failure mapping.
