# Carto API

## Principe

| Préfixe             | Rôle                      | Appelé par                                      | Auth                                       |
| ------------------- | ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| `/api/v1/public/*`  | Surface externe           | intégrations, clients MCP, monitoring           | clé API, token OAuth MCP, ou aucune        |
| `/api/v1/private/*` | Appartient à l'app        | front de l'app, Better Auth, Stripe, flux OAuth | cookie de session ou protocole Better Auth |
| `/_serverFn/*`      | Server functions TanStack | front de l'app                                  | cookie de session                          |

## Arborescence cible

```
/api/v1
├── public
│   ├── health                          GET   aucune
│   ├── mcp                             POST  token OAuth MCP
│   └── me                              GET   clé API            (nouveau)
└── private
    ├── auth/$                          GET/POST  Better Auth (+ webhook Stripe, OAuth provider)
    ├── admin
    │   ├── users/export                GET   cookie + users:read
    │   ├── organizations/export        GET   cookie + organizations:read
    │   └── audit-logs/export           GET   cookie + audit-logs:read
    ├── notifications/stream            GET   cookie (SSE)
    └── user/export/$exportId           GET   cookie
```

## Routes HTTP : avant / après

| Avant                              | Après                                        | Fichier source                                                                                   | Auth                          | Rate limit                |
| ---------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------- |
| `/api/health`                      | `/api/v1/public/health`                      | `src/app/api/health.ts`                                                                          | aucune                        | exclu                     |
| `/api/mcp`                         | `/api/v1/public/mcp`                         | `src/app/api/mcp.ts`                                                                             | token OAuth MCP               | par user du token         |
| —                                  | `/api/v1/public/me`                          | nouveau                                                                                          | clé API                       | par clé                   |
| `/api/auth/$`                      | `/api/v1/private/auth/$`                     | `src/app/api/auth/$.ts`                                                                          | Better Auth                   | limiteur Better Auth seul |
| `/api/admin/users/export`          | `/api/v1/private/admin/users/export`         | `src/app/api/admin/users/export.ts`                                                              | cookie + `users:read`         | par IP                    |
| `/api/admin/organizations/export`  | `/api/v1/private/admin/organizations/export` | `src/app/api/admin/organizations/export.ts`                                                      | cookie + `organizations:read` | par IP                    |
| `/api/admin/audit-logs/export`     | `/api/v1/private/admin/audit-logs/export`    | `src/app/api/admin/audit-logs/export.ts`                                                         | cookie + `audit-logs:read`    | par IP                    |
| `/api/notifications/stream`        | `/api/v1/private/notifications/stream`       | `src/app/api/notifications/stream.ts`                                                            | cookie                        | par IP                    |
| `/api/user/data-exports/$exportId` | `/api/v1/private/user/export/$exportId`      | `src/app/api/user/data-exports/$exportId.ts` → `src/app/api/v1/private/user/export/$exportId.ts` | cookie                        | par IP                    |
| `/.well-known/$`                   | inchangé                                     | `src/app/[.]well-known/$.ts`                                                                     | aucune                        | aucun                     |

## Server functions

Elles restent sur `/_serverFn/*`. Seules les `POST` (mutations) sont rate limitées. Les `GET` sont les loaders appelés à chaque navigation et ne le sont pas.

| Fichier                              | GET                                                                                                      | POST                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `admin.functions.ts`                 | overview, users, organizations, audit logs, roles                                                        | set role, ban, unban, create/update/delete role                             |
| `auth.functions.ts`                  | getSession, getSocialProviders, requireSession                                                           | —                                                                           |
| `impersonation.functions.ts`         | —                                                                                                        | impersonate, stop                                                           |
| `notification.functions.ts`          | list                                                                                                     | mark read, préférences                                                      |
| `oauth.functions.ts`                 | consent data                                                                                             | —                                                                           |
| `organization-activity.functions.ts` | activity data                                                                                            | —                                                                           |
| `organization.functions.ts`          | list                                                                                                     | update, create, set active, remove member, invite, cancel/accept invitation |
| `page-data.functions.ts`             | 9 loaders (dashboard, settings, billing, profile, notifications, security, organization, changelog, mcp) | —                                                                           |
| `root.functions.ts`                  | getRootI18n                                                                                              | —                                                                           |
| `search.functions.ts`                | globalSearch (garde son limiteur `search:${userId}`)                                                     | —                                                                           |
| `session.functions.ts`               | sessions                                                                                                 | revoke, revoke others                                                       |
| `storage.functions.ts`               | —                                                                                                        | avatar, logo                                                                |
| `user.functions.ts`                  | —                                                                                                        | update, préférences, data export                                            |

## MCP

Endpoint `/api/v1/public/mcp`. Les outils (`src/mcp/tools/*.tools.ts`) appellent les mêmes controllers que les server functions.

| Fichier                 | Outils                                                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user.tools.ts`         | get_current_user, update_profile, update_notification_preferences                                                                                                                                          |
| `organization.tools.ts` | list/create/update organization, list/remove member, list/invite/cancel/accept invitation                                                                                                                  |
| `admin.tools.ts`        | admin_get_overview, admin_list_users, admin_set_user_role, admin_ban_user, admin_unban_user, admin_list_organizations, admin_get_organization, admin_list_audit_logs, admin_list/create/update/delete_role |

## Rate limit

| Cible                                       | Détection                              | Clé                       | Limite                                  |
| ------------------------------------------- | -------------------------------------- | ------------------------- | --------------------------------------- |
| `/api/v1/public/health`                     | pathname                               | —                         | aucune                                  |
| `/api/v1/public/mcp`                        | pathname                               | IP                        | 100/min                                 |
| `/api/v1/public/*` (autres)                 | pathname + plugin api-key              | IP, puis id de la clé API | 100/min chacun                          |
| `/api/v1/private/auth/*`                    | pathname                               | —                         | middleware ignoré, limiteur Better Auth |
| `/api/v1/private/*` (autres)                | pathname                               | IP                        | 100/min                                 |
| server fn `POST`                            | `handlerType === "serverFn"` + méthode | IP                        | 100/min                                 |
| pages, loaders `GET`, assets, `.well-known` | —                                      | —                         | aucune                                  |

La règle est dans `shouldRateLimitRequest` (`src/shared/infrastructure/rate-limit/rate-limit-scope.ts`), appelée par `rateLimitMiddleware` (`src/start.ts`). Tout est désactivé hors production.

## Clés API

- Package `@better-auth/api-key`, à aligner sur la version Better Auth du projet (1.7.15)
- Modèle Prisma + migration
- Page `/settings/api-keys` : créer, lister, révoquer (bloqué pendant une impersonation)
- Logs d'audit `auth.api-key.created` et `auth.api-key.revoked`
- Wrapper `publicRoute(feature, level)` dans `lib/zod-route.ts` : lit `x-api-key` (pas de cookie), résout le user puis son `access`, applique `hasAccess`

## Fichiers à mettre à jour

| Changement                          | Fichiers                                                                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth vers `/api/v1/private/auth`    | `lib/auth.ts` (`basePath`), `lib/auth-client.ts` (`basePath`), `src/shared/infrastructure/http/oauth-query.ts`, `package.json` (script `stripe`), `src/features/email/infrastructure/adapters/__tests__/console-email.adapter.test.ts`, `README.md`                 |
| MCP vers `/api/v1/public/mcp`       | `lib/mcp/resource.ts`, `README.md`, `AGENTS.md`                                                                                                                                                                                                                     |
| Health vers `/api/v1/public/health` | `compose.production.yaml`, `.github/workflows/ci.yml`, `src/start.ts`, `README.md`                                                                                                                                                                                  |
| Routes privées                      | `components/features/dashboard/admin/admin-{users,organizations,audit-logs}-table.tsx` (`exportHref`), `hooks/use-notifications.ts`, `lib/navigation.tsx`, `src/features/user/domain/data-export.policy.ts` (lien de téléchargement, y compris dans l'email envoyé) |
| Rate limit                          | `src/start.ts`                                                                                                                                                                                                                                                      |
| Doc                                 | `AGENTS.md`, `.agents/skills/api-patterns`, `.agents/skills/page-creation/references/reference.md`                                                                                                                                                                  |

## À changer hors du code

| Où                             | Quoi                                                      |
| ------------------------------ | --------------------------------------------------------- |
| Dashboard Stripe               | URL du webhook : `/api/v1/private/auth/stripe/webhook`    |
| Consoles des providers sociaux | redirect URI : `/api/v1/private/auth/callback/<provider>` |
| Coolify                        | chemin du healthcheck s'il est défini à part du compose   |

## Ce qui casse

- Les liens de vérification et de reset déjà envoyés par email
- Les tokens MCP déjà émis (l'audience est l'ancienne URL) : les clients devront se reconnecter
- Les liens d'export ou de téléchargement déjà partagés

## Vérifié

- La discovery OAuth suit le nouveau `basePath` : `/.well-known/oauth-authorization-server/api/v1/private/auth` et `/.well-known/oauth-protected-resource/api/v1/public/mcp` répondent 200
- `@better-auth/api-key@1.7.15` est installé
- `GET /api/v1/public/me` : 401 sans clé ou avec une clé invalide, 200 avec une clé valide
- Les endpoints HTTP `/api-key/*` de Better Auth répondent 404

## Ordre de travail

1. Rate limit ciblé
2. Déplacement vers `/api/v1/public` et `/api/v1/private`, avec les appelants
3. Plugin api-key, migration, page de gestion
4. `publicRoute`, `GET /api/v1/public/me`, tests
