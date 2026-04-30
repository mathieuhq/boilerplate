---
name: clean-architecture
description: Clean Architecture domain, application, infrastructure, interface, repository, use case, controller, mapper, Result, and DI patterns. Use when adding features, entities, value objects, repositories, adapters, use cases, controllers, or container wiring.
---

# Clean Architecture

## Workflow

- Model business rules in `src/features/{domain}/domain` with entities, value objects, repository interfaces, and domain errors.
- Put orchestration in application use cases and return `Result<T>` for expected success/failure.
- Keep persistence and external providers in infrastructure repositories, adapters, services, and mappers.
- Expose use cases through interface controllers and validation schemas.
- Wire implementations through `src/shared/infrastructure/di/container` instead of instantiating cross-layer dependencies ad hoc.
- Preserve dependency direction: outer layers depend on inner contracts, never the reverse.

## Resources

- Read [references/reference.md](references/reference.md) for dependency flow, layer responsibilities, base classes, DI methods, repository interfaces, and mapper patterns.
- Read [references/examples.md](references/examples.md) for entity, value object, use case, repository, mapper, controller, and DI examples.

## Boundaries

- Use `$api-patterns` for route/action placement and response helpers.
- Use `$testing` when adding or updating domain and application tests.
- Use `$error-handling` for error class selection and failure mapping.
