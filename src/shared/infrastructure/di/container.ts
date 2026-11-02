import { BanAdminUserUseCase } from "@/features/admin/application/use-cases/ban-admin-user.use-case";
import { CreateAdminRoleUseCase } from "@/features/admin/application/use-cases/create-admin-role.use-case";
import { DeleteAdminRoleUseCase } from "@/features/admin/application/use-cases/delete-admin-role.use-case";
import { ExportAdminAuditLogsUseCase } from "@/features/admin/application/use-cases/export-admin-audit-logs.use-case";
import { ExportAdminOrganizationsUseCase } from "@/features/admin/application/use-cases/export-admin-organizations.use-case";
import { ExportAdminUsersUseCase } from "@/features/admin/application/use-cases/export-admin-users.use-case";
import { GetAdminAuditLogFacetsUseCase } from "@/features/admin/application/use-cases/get-admin-audit-log-facets.use-case";
import { GetAdminOrganizationDetailsUseCase } from "@/features/admin/application/use-cases/get-admin-organization-details.use-case";
import { GetAdminOverviewMetricsUseCase } from "@/features/admin/application/use-cases/get-admin-overview-metrics.use-case";
import { GetRegistrationStatsUseCase } from "@/features/admin/application/use-cases/get-registration-stats.use-case";
import { ListAdminAuditLogsUseCase } from "@/features/admin/application/use-cases/list-admin-audit-logs.use-case";
import { ListAdminOrganizationsUseCase } from "@/features/admin/application/use-cases/list-admin-organizations.use-case";
import { ListAdminRolesUseCase } from "@/features/admin/application/use-cases/list-admin-roles.use-case";
import { ListAdminUsersUseCase } from "@/features/admin/application/use-cases/list-admin-users.use-case";
import { PromoteToAdminUseCase } from "@/features/admin/application/use-cases/promote-to-admin.use-case";
import { ResolveAccessUseCase } from "@/features/admin/application/use-cases/resolve-access.use-case";
import { SetAdminUserRoleUseCase } from "@/features/admin/application/use-cases/set-admin-user-role.use-case";
import { UnbanAdminUserUseCase } from "@/features/admin/application/use-cases/unban-admin-user.use-case";
import { UpdateAdminRoleUseCase } from "@/features/admin/application/use-cases/update-admin-role.use-case";
import {
  type ActiveSessionCounter,
  PrismaActiveSessionCounter,
  RedisActiveSessionCounter,
} from "@/features/admin/infrastructure/adapters/active-session-counter";
import { PrismaAdminRoleRepository } from "@/features/admin/infrastructure/repositories/prisma-admin-role.repository";
import { PrismaAdminRepository } from "@/features/admin/infrastructure/repositories/prisma-admin.repository";
import { AdminController } from "@/features/admin/interface/controllers/admin.controller";
import { GetCurrentUserUseCase as AuthGetCurrentUserUseCase } from "@/features/auth/application/use-cases/get-current-user.use-case";
import { GetSessionUseCase } from "@/features/auth/application/use-cases/get-session.use-case";
import { PurgeExpiredAuthRecordsUseCase } from "@/features/auth/application/use-cases/purge-expired-auth-records.use-case";
import { BetterAuthAdapter } from "@/features/auth/infrastructure/adapters/better-auth.adapter";
import { PrismaExpiredAuthRecordsRepository } from "@/features/auth/infrastructure/repositories/prisma-expired-auth-records.repository";
import { AuthController } from "@/features/auth/interface/controllers/auth.controller";
import type { IEmailProviderPort } from "@/features/email/application/ports/email-provider.port";
import { QueueEmailUseCase } from "@/features/email/application/use-cases/queue-email.use-case";
import { SendEmailUseCase } from "@/features/email/application/use-cases/send-email.use-case";
import { SubscribeContactUseCase } from "@/features/email/application/use-cases/subscribe-contact.use-case";
import { UnsubscribeContactUseCase } from "@/features/email/application/use-cases/unsubscribe-contact.use-case";
import { ConsoleEmailAdapter } from "@/features/email/infrastructure/adapters/console-email.adapter";
import { PlunkAdapter } from "@/features/email/infrastructure/adapters/plunk.adapter";
import { UnavailableEmailAdapter } from "@/features/email/infrastructure/adapters/unavailable-email.adapter";
import { EmailController } from "@/features/email/interface/controllers/email.controller";
import { DispatchNotificationUseCase } from "@/features/notification/application/use-cases/dispatch-notification.use-case";
import { ListNotificationsUseCase } from "@/features/notification/application/use-cases/list-notifications.use-case";
import { MarkAllNotificationsReadUseCase } from "@/features/notification/application/use-cases/mark-all-notifications-read.use-case";
import { MarkNotificationsReadUseCase } from "@/features/notification/application/use-cases/mark-notifications-read.use-case";
import { PurgeReadNotificationsUseCase } from "@/features/notification/application/use-cases/purge-read-notifications.use-case";
import { SendNotificationUseCase } from "@/features/notification/application/use-cases/send-notification.use-case";
import { PrismaNotificationRecipientsAdapter } from "@/features/notification/infrastructure/adapters/prisma-notification-recipients.adapter";
import { PrismaNotificationRepository } from "@/features/notification/infrastructure/repositories/prisma-notification.repository";
import { NotificationController } from "@/features/notification/interface/controllers/notification.controller";
import { AcceptOrganizationInvitationUseCase } from "@/features/organization/application/use-cases/accept-organization-invitation.use-case";
import { CancelOrganizationInvitationUseCase } from "@/features/organization/application/use-cases/cancel-organization-invitation.use-case";
import { CreateOrganizationUseCase } from "@/features/organization/application/use-cases/create-organization.use-case";
import { GetCurrentUserOrganizationUseCase } from "@/features/organization/application/use-cases/get-current-user-organization.use-case";
import { InviteOrganizationMemberUseCase } from "@/features/organization/application/use-cases/invite-organization-member.use-case";
import { ListCurrentUserOrganizationsUseCase } from "@/features/organization/application/use-cases/list-current-user-organizations.use-case";
import { ListOrganizationInvitationsUseCase } from "@/features/organization/application/use-cases/list-organization-invitations.use-case";
import { ListOrganizationMembersUseCase } from "@/features/organization/application/use-cases/list-organization-members.use-case";
import { RemoveOrganizationMemberUseCase } from "@/features/organization/application/use-cases/remove-organization-member.use-case";
import { ResolveActiveOrganizationUseCase } from "@/features/organization/application/use-cases/resolve-active-organization.use-case";
import { SetActiveOrganizationUseCase } from "@/features/organization/application/use-cases/set-active-organization.use-case";
import { UpdateOrganizationUseCase } from "@/features/organization/application/use-cases/update-organization.use-case";
import { BetterAuthOrganizationManagementAdapter } from "@/features/organization/infrastructure/adapters/better-auth-organization-management.adapter";
import { PrismaOrganizationRepository } from "@/features/organization/infrastructure/repositories/prisma-organization.repository";
import { OrganizationController } from "@/features/organization/interface/controllers/organization.controller";
import type { IObjectStoragePort } from "@/features/storage/application/ports/object-storage.port";
import { DeleteFileUseCase } from "@/features/storage/application/use-cases/delete-file.use-case";
import { GenerateDownloadUrlUseCase } from "@/features/storage/application/use-cases/generate-download-url.use-case";
import { GenerateUploadUrlUseCase } from "@/features/storage/application/use-cases/generate-upload-url.use-case";
import { ProcessAndUploadFileUseCase } from "@/features/storage/application/use-cases/process-and-upload-file.use-case";
import { R2Adapter } from "@/features/storage/infrastructure/adapters/r2.adapter";
import { UnavailableObjectStorageAdapter } from "@/features/storage/infrastructure/adapters/unavailable-object-storage.adapter";
import { ImageCompressorService } from "@/features/storage/infrastructure/services/image-compressor.service";
import { StorageController } from "@/features/storage/interface/controllers/storage.controller";
import { DeleteUserUseCase } from "@/features/user/application/use-cases/delete-user.use-case";
import { GetCurrentUserUseCase } from "@/features/user/application/use-cases/get-current-user.use-case";
import { GetUserByIdUseCase } from "@/features/user/application/use-cases/get-user-by-id.use-case";
import { GetUserForEmailUseCase } from "@/features/user/application/use-cases/get-user-for-email.use-case";
import { UpdateNotificationPreferencesUseCase } from "@/features/user/application/use-cases/update-notification-preferences.use-case";
import { UpdateUserProfileUseCase } from "@/features/user/application/use-cases/update-user-profile.use-case";
import { CachedUserRepository } from "@/features/user/infrastructure/repositories/cached-user.repository";
import { PrismaUserRepository } from "@/features/user/infrastructure/repositories/prisma-user.repository";
import { UserController } from "@/features/user/interface/controllers/user.controller";
import type { AppJobs } from "@/jobs/jobs";
import { db } from "@/lib/db";
import { env, getEmailConfig, getObjectStorageConfig } from "@/lib/env";
import { logger } from "@/lib/logger";
import { notificationBroker } from "@/lib/notification-broker";
import { jobQueue } from "@/lib/queue";
import { redis } from "@/lib/redis";
import { SITE_CONFIG } from "@/lib/site-config";
import type { ICachePort } from "@/shared/application/ports/cache.port";
import type {
  IJobQueuePort,
  JobHandlers,
} from "@/shared/application/ports/job-queue.port";
import { NoopCacheAdapter } from "@/shared/infrastructure/cache/noop-cache.adapter";
import { RedisCacheAdapter } from "@/shared/infrastructure/cache/redis-cache.adapter";
import { BullMqJobQueueAdapter } from "@/shared/infrastructure/jobs/bullmq-job-queue.adapter";
import { InlineJobQueueAdapter } from "@/shared/infrastructure/jobs/inline-job-queue.adapter";
import { createJobProcessor } from "@/shared/infrastructure/jobs/job-processor";

class Container {
  private _cache?: ICachePort;
  private _betterAuthAdapter?: BetterAuthAdapter;
  private _emailProvider?: IEmailProviderPort;
  private _objectStorage?: IObjectStoragePort;
  private _userRepository?: CachedUserRepository;
  private _prismaAdminRepository?: PrismaAdminRepository;
  private _prismaAdminRoleRepository?: PrismaAdminRoleRepository;
  private _prismaOrganizationRepository?: PrismaOrganizationRepository;
  private _notificationRepository?: PrismaNotificationRepository;
  private _betterAuthOrganizationManagementAdapter?: BetterAuthOrganizationManagementAdapter;

  getUserController(): UserController {
    const userRepository = this.getUserRepository();
    const authProvider = this.getBetterAuthAdapter();
    const emailProvider = this.getEmailProvider();

    return new UserController(
      new DeleteUserUseCase(userRepository),
      new GetUserByIdUseCase(userRepository),
      new GetCurrentUserUseCase(userRepository, authProvider),
      new GetUserForEmailUseCase(userRepository),
      new UpdateUserProfileUseCase(userRepository),
      new UpdateNotificationPreferencesUseCase(userRepository, {
        subscribeContact: async (user) => {
          const result = await emailProvider.subscribeContact?.({
            email: user.email.value,
            name: user.name,
          });
          return result;
        },
        unsubscribeContact: async (contactId) => {
          await emailProvider.unsubscribeContact?.(contactId);
        },
      }),
    );
  }

  getEmailController(): EmailController {
    const emailProvider = this.getEmailProvider();

    return new EmailController(
      new SendEmailUseCase(emailProvider),
      new QueueEmailUseCase(this.getJobQueue<"email.send">()),
      new SubscribeContactUseCase(emailProvider),
      new UnsubscribeContactUseCase(emailProvider),
    );
  }

  getAuthController(): AuthController {
    const authProvider = this.getBetterAuthAdapter();

    return new AuthController(
      new GetSessionUseCase(authProvider),
      new AuthGetCurrentUserUseCase(authProvider),
      new PurgeExpiredAuthRecordsUseCase(
        new PrismaExpiredAuthRecordsRepository(db),
      ),
    );
  }

  getAdminController(): AdminController {
    const authProvider = this.getBetterAuthAdapter();
    const adminRepository = this.getPrismaAdminRepository();
    const roleRepository = this.getPrismaAdminRoleRepository();

    return new AdminController(
      new PromoteToAdminUseCase(authProvider),
      new GetRegistrationStatsUseCase(adminRepository),
      new GetAdminOverviewMetricsUseCase(adminRepository, this.getCache()),
      new ListAdminUsersUseCase(adminRepository),
      new SetAdminUserRoleUseCase(
        adminRepository,
        roleRepository,
        authProvider,
      ),
      new BanAdminUserUseCase(adminRepository, roleRepository, authProvider),
      new UnbanAdminUserUseCase(adminRepository, roleRepository),
      new ListAdminOrganizationsUseCase(adminRepository),
      new GetAdminOrganizationDetailsUseCase(adminRepository),
      new ListAdminAuditLogsUseCase(adminRepository),
      new ResolveAccessUseCase(roleRepository),
      new ListAdminRolesUseCase(roleRepository),
      new CreateAdminRoleUseCase(roleRepository, adminRepository),
      new UpdateAdminRoleUseCase(roleRepository, adminRepository),
      new DeleteAdminRoleUseCase(roleRepository, adminRepository),
      new GetAdminAuditLogFacetsUseCase(adminRepository),
      new ExportAdminUsersUseCase(adminRepository),
      new ExportAdminOrganizationsUseCase(adminRepository),
      new ExportAdminAuditLogsUseCase(adminRepository),
    );
  }

  getStorageController(): StorageController {
    const objectStorage = this.getObjectStorage();
    const imageCompressor = new ImageCompressorService();

    return new StorageController(
      new GenerateUploadUrlUseCase(objectStorage),
      new GenerateDownloadUrlUseCase(objectStorage),
      new DeleteFileUseCase(objectStorage),
      new ProcessAndUploadFileUseCase(objectStorage, imageCompressor),
    );
  }

  getOrganizationController(): OrganizationController {
    const organizationRepository = this.getPrismaOrganizationRepository();
    const organizationManagement =
      this.getBetterAuthOrganizationManagementAdapter();
    const authProvider = this.getBetterAuthAdapter();

    return new OrganizationController(
      new GetCurrentUserOrganizationUseCase(
        organizationRepository,
        authProvider,
      ),
      new UpdateOrganizationUseCase(organizationManagement),
      new AcceptOrganizationInvitationUseCase(organizationManagement),
      new InviteOrganizationMemberUseCase(organizationManagement),
      new ListCurrentUserOrganizationsUseCase(organizationManagement),
      new CreateOrganizationUseCase(organizationManagement),
      new SetActiveOrganizationUseCase(organizationManagement),
      new ResolveActiveOrganizationUseCase(
        organizationManagement,
        authProvider,
      ),
      new ListOrganizationMembersUseCase(organizationManagement, authProvider),
      new RemoveOrganizationMemberUseCase(organizationManagement),
      new ListOrganizationInvitationsUseCase(organizationManagement),
      new CancelOrganizationInvitationUseCase(organizationManagement),
    );
  }

  getNotificationController(): NotificationController {
    const notificationRepository = this.getNotificationRepository();

    return new NotificationController(
      new SendNotificationUseCase(this.getJobQueue<"notification.dispatch">()),
      new DispatchNotificationUseCase(
        new PrismaNotificationRecipientsAdapter(db),
        notificationRepository,
        notificationBroker,
      ),
      new ListNotificationsUseCase(notificationRepository),
      new MarkNotificationsReadUseCase(
        notificationRepository,
        notificationBroker,
      ),
      new MarkAllNotificationsReadUseCase(
        notificationRepository,
        notificationBroker,
      ),
      new PurgeReadNotificationsUseCase(notificationRepository),
      notificationBroker,
    );
  }

  getDb() {
    return db;
  }

  getCache(): ICachePort {
    this._cache ??= redis
      ? new RedisCacheAdapter(
          redis,
          `@${SITE_CONFIG.APP_ID}/cache`,
          (message, details) => logger.warn(message, details),
        )
      : new NoopCacheAdapter();

    return this._cache;
  }

  getJobHandlers(): JobHandlers<AppJobs> {
    return {
      "email.send": async (payload) =>
        this.getEmailController().deliverQueuedEmail(payload),
      "auth.purge-expired-records": async () =>
        this.getAuthController().purgeExpiredRecords(),
      "notification.dispatch": async (payload) =>
        this.getNotificationController().dispatch(payload),
      "notification.purge-read": async () =>
        this.getNotificationController().purgeRead(),
    };
  }

  getEnv() {
    return env;
  }

  private getJobQueue<TName extends keyof AppJobs>(): IJobQueuePort<
    Pick<AppJobs, TName>
  > {
    if (jobQueue) return new BullMqJobQueueAdapter(jobQueue);

    return new InlineJobQueueAdapter(async (job) =>
      createJobProcessor(this.getJobHandlers())(job),
    );
  }

  private getBetterAuthAdapter(): BetterAuthAdapter {
    this._betterAuthAdapter ??= new BetterAuthAdapter();
    return this._betterAuthAdapter;
  }

  private getEmailProvider(): IEmailProviderPort {
    const config = getEmailConfig();

    this._emailProvider ??= config
      ? new PlunkAdapter(config)
      : env.NODE_ENV === "development"
        ? new ConsoleEmailAdapter((message, details) =>
            logger.info(message, details),
          )
        : new UnavailableEmailAdapter();

    return this._emailProvider;
  }

  private getUserRepository(): CachedUserRepository {
    this._userRepository ??= new CachedUserRepository(
      new PrismaUserRepository(db),
      this.getCache(),
    );
    return this._userRepository;
  }

  private getPrismaAdminRepository(): PrismaAdminRepository {
    this._prismaAdminRepository ??= new PrismaAdminRepository(
      db,
      this.getActiveSessionCounter(),
    );
    return this._prismaAdminRepository;
  }

  private getPrismaAdminRoleRepository(): PrismaAdminRoleRepository {
    this._prismaAdminRoleRepository ??= new PrismaAdminRoleRepository(db);
    return this._prismaAdminRoleRepository;
  }

  private getActiveSessionCounter(): ActiveSessionCounter {
    const client = redis;

    if (!client) return new PrismaActiveSessionCounter(db);

    return new RedisActiveSessionCounter({
      scan: async (cursor, pattern) =>
        client.scan(cursor, "MATCH", pattern, "COUNT", 500),
      mget: async (keys) => client.mget(keys),
    });
  }

  private getNotificationRepository(): PrismaNotificationRepository {
    this._notificationRepository ??= new PrismaNotificationRepository(db);
    return this._notificationRepository;
  }

  private getPrismaOrganizationRepository(): PrismaOrganizationRepository {
    this._prismaOrganizationRepository ??= new PrismaOrganizationRepository(db);
    return this._prismaOrganizationRepository;
  }

  private getBetterAuthOrganizationManagementAdapter(): BetterAuthOrganizationManagementAdapter {
    this._betterAuthOrganizationManagementAdapter ??=
      new BetterAuthOrganizationManagementAdapter(this.getCache());
    return this._betterAuthOrganizationManagementAdapter;
  }

  private getObjectStorage(): IObjectStoragePort {
    const config = getObjectStorageConfig();

    this._objectStorage ??= config
      ? new R2Adapter(config)
      : new UnavailableObjectStorageAdapter();

    return this._objectStorage;
  }
}

export const container = new Container();
