import { GetRegistrationStatsUseCase } from "@/features/admin/application/use-cases/get-registration-stats.use-case";
import { PromoteToAdminUseCase } from "@/features/admin/application/use-cases/promote-to-admin.use-case";
import { PrismaAdminRepository } from "@/features/admin/infrastructure/repositories/prisma-admin.repository";
import { AdminController } from "@/features/admin/interface/controllers/admin.controller";
import { GetCurrentUserUseCase as AuthGetCurrentUserUseCase } from "@/features/auth/application/use-cases/get-current-user.use-case";
import { GetSessionUseCase } from "@/features/auth/application/use-cases/get-session.use-case";
import { BetterAuthAdapter } from "@/features/auth/infrastructure/adapters/better-auth.adapter";
import { AuthController } from "@/features/auth/interface/controllers/auth.controller";
import { SendEmailUseCase } from "@/features/email/application/use-cases/send-email.use-case";
import { SubscribeContactUseCase } from "@/features/email/application/use-cases/subscribe-contact.use-case";
import { UnsubscribeContactUseCase } from "@/features/email/application/use-cases/unsubscribe-contact.use-case";
import { ResendAdapter } from "@/features/email/infrastructure/adapters/resend.adapter";
import { EmailController } from "@/features/email/interface/controllers/email.controller";
import { GetCurrentUserOrganizationUseCase } from "@/features/organization/application/use-cases/get-current-user-organization.use-case";
import { PrismaOrganizationRepository } from "@/features/organization/infrastructure/repositories/prisma-organization.repository";
import { OrganizationController } from "@/features/organization/interface/controllers/organization.controller";
import { DeleteFileUseCase } from "@/features/storage/application/use-cases/delete-file.use-case";
import { GenerateDownloadUrlUseCase } from "@/features/storage/application/use-cases/generate-download-url.use-case";
import { GenerateUploadUrlUseCase } from "@/features/storage/application/use-cases/generate-upload-url.use-case";
import { ProcessAndUploadFileUseCase } from "@/features/storage/application/use-cases/process-and-upload-file.use-case";
import { R2Adapter } from "@/features/storage/infrastructure/adapters/r2.adapter";
import { ImageCompressorService } from "@/features/storage/infrastructure/services/image-compressor.service";
import { StorageController } from "@/features/storage/interface/controllers/storage.controller";
import { DeleteUserUseCase } from "@/features/user/application/use-cases/delete-user.use-case";
import { GetCurrentUserUseCase } from "@/features/user/application/use-cases/get-current-user.use-case";
import { GetUserByIdUseCase } from "@/features/user/application/use-cases/get-user-by-id.use-case";
import { GetUserForEmailUseCase } from "@/features/user/application/use-cases/get-user-for-email.use-case";
import { UpdateNotificationPreferencesUseCase } from "@/features/user/application/use-cases/update-notification-preferences.use-case";
import { UpdateUserProfileUseCase } from "@/features/user/application/use-cases/update-user-profile.use-case";
import { PrismaUserRepository } from "@/features/user/infrastructure/repositories/prisma-user.repository";
import { UserController } from "@/features/user/interface/controllers/user.controller";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

class Container {
  private _betterAuthAdapter?: BetterAuthAdapter;
  private _resendAdapter?: ResendAdapter;
  private _r2Adapter?: R2Adapter;
  private _prismaUserRepository?: PrismaUserRepository;
  private _prismaAdminRepository?: PrismaAdminRepository;
  private _prismaOrganizationRepository?: PrismaOrganizationRepository;

  getUserController(): UserController {
    const userRepository = this.getPrismaUserRepository();
    const authProvider = this.getBetterAuthAdapter();
    const emailAdapter = this.getResendAdapter();

    return new UserController(
      new DeleteUserUseCase(userRepository),
      new GetUserByIdUseCase(userRepository),
      new GetCurrentUserUseCase(userRepository, authProvider),
      new GetUserForEmailUseCase(userRepository),
      new UpdateUserProfileUseCase(userRepository),
      new UpdateNotificationPreferencesUseCase(userRepository, {
        subscribeContact: async (user) => {
          const result = await emailAdapter.subscribeContact({
            email: user.email.value,
            name: user.name,
          });
          return result;
        },
        unsubscribeContact: async (contactId) => {
          await emailAdapter.unsubscribeContact(contactId);
        },
      }),
    );
  }

  getEmailController(): EmailController {
    const emailAdapter = this.getResendAdapter();

    return new EmailController(
      new SendEmailUseCase(emailAdapter),
      new SubscribeContactUseCase(emailAdapter),
      new UnsubscribeContactUseCase(emailAdapter),
    );
  }

  getAuthController(): AuthController {
    const authProvider = this.getBetterAuthAdapter();

    return new AuthController(
      new GetSessionUseCase(authProvider),
      new AuthGetCurrentUserUseCase(authProvider),
    );
  }

  getAdminController(): AdminController {
    const authProvider = this.getBetterAuthAdapter();
    const adminRepository = this.getPrismaAdminRepository();

    return new AdminController(
      new PromoteToAdminUseCase(authProvider),
      new GetRegistrationStatsUseCase(adminRepository),
    );
  }

  getStorageController(): StorageController {
    const r2Adapter = this.getR2Adapter();
    const imageCompressor = new ImageCompressorService();

    return new StorageController(
      new GenerateUploadUrlUseCase(r2Adapter),
      new GenerateDownloadUrlUseCase(r2Adapter),
      new DeleteFileUseCase(r2Adapter),
      new ProcessAndUploadFileUseCase(r2Adapter, imageCompressor),
    );
  }

  getOrganizationController(): OrganizationController {
    const organizationRepository = this.getPrismaOrganizationRepository();
    const authProvider = this.getBetterAuthAdapter();

    return new OrganizationController(
      new GetCurrentUserOrganizationUseCase(
        organizationRepository,
        authProvider,
      ),
    );
  }

  getDb() {
    return db;
  }

  getEnv() {
    return env;
  }

  private getBetterAuthAdapter(): BetterAuthAdapter {
    this._betterAuthAdapter ??= new BetterAuthAdapter();
    return this._betterAuthAdapter;
  }

  private getResendAdapter(): ResendAdapter {
    this._resendAdapter ??= new ResendAdapter(env.RESEND_API_KEY);
    return this._resendAdapter;
  }

  private getPrismaUserRepository(): PrismaUserRepository {
    this._prismaUserRepository ??= new PrismaUserRepository(db);
    return this._prismaUserRepository;
  }

  private getPrismaAdminRepository(): PrismaAdminRepository {
    this._prismaAdminRepository ??= new PrismaAdminRepository(db);
    return this._prismaAdminRepository;
  }

  private getPrismaOrganizationRepository(): PrismaOrganizationRepository {
    this._prismaOrganizationRepository ??= new PrismaOrganizationRepository(db);
    return this._prismaOrganizationRepository;
  }

  private getR2Adapter(): R2Adapter {
    this._r2Adapter ??= new R2Adapter({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucketName: env.R2_BUCKET_NAME,
    });
    return this._r2Adapter;
  }
}

export const container = new Container();
