import { ListUsersUseCase } from "@/features/admin/application/use-cases/list-users.use-case";
import { PromoteToAdminUseCase } from "@/features/admin/application/use-cases/promote-to-admin.use-case";
import { RemoveUserUseCase } from "@/features/admin/application/use-cases/remove-user.use-case";
import { SetUserPasswordUseCase } from "@/features/admin/application/use-cases/set-user-password.use-case";
import { SetUserRoleUseCase } from "@/features/admin/application/use-cases/set-user-role.use-case";
import { AdminController } from "@/features/admin/interface/controllers/admin.controller";
import { GetActiveSubscriptionsUseCase } from "@/features/auth/application/use-cases/get-active-subscriptions.use-case";
import { GetCurrentUserUseCase as AuthGetCurrentUserUseCase } from "@/features/auth/application/use-cases/get-current-user.use-case";
import { GetSessionUseCase } from "@/features/auth/application/use-cases/get-session.use-case";
import { BetterAuthAdapter } from "@/features/auth/infrastructure/adapters/better-auth.adapter";
import { AuthController } from "@/features/auth/interface/controllers/auth.controller";
import { SendEmailUseCase } from "@/features/email/application/use-cases/send-email.use-case";
import { SubscribeContactUseCase } from "@/features/email/application/use-cases/subscribe-contact.use-case";
import { UnsubscribeContactUseCase } from "@/features/email/application/use-cases/unsubscribe-contact.use-case";
import { ResendAdapter } from "@/features/email/infrastructure/adapters/resend.adapter";
import { EmailController } from "@/features/email/interface/controllers/email.controller";
import { DeleteUserUseCase } from "@/features/user/application/use-cases/delete-user.use-case";
import { GetCurrentUserUseCase } from "@/features/user/application/use-cases/get-current-user.use-case";
import { GetUserByIdUseCase } from "@/features/user/application/use-cases/get-user-by-id.use-case";
import { GetUserByStripeCustomerIdUseCase } from "@/features/user/application/use-cases/get-user-by-stripe-customer-id.use-case";
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
  private _prismaUserRepository?: PrismaUserRepository;

  getUserController(): UserController {
    const userRepository = this.getPrismaUserRepository();
    const authProvider = this.getBetterAuthAdapter();
    const emailAdapter = this.getResendAdapter();

    return new UserController(
      new GetCurrentUserUseCase(userRepository, authProvider),
      new GetUserByIdUseCase(userRepository),
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
      new DeleteUserUseCase(userRepository),
      new GetUserForEmailUseCase(userRepository),
      new GetUserByStripeCustomerIdUseCase(userRepository),
      async () => {
        const authController = this.getAuthController();
        return authController.getActiveSubscriptions();
      },
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
      new GetActiveSubscriptionsUseCase(authProvider),
    );
  }

  getAdminController(): AdminController {
    const authProvider = this.getBetterAuthAdapter();

    return new AdminController(
      new ListUsersUseCase(authProvider),
      new RemoveUserUseCase(authProvider),
      new SetUserRoleUseCase(authProvider),
      new SetUserPasswordUseCase(authProvider),
      new PromoteToAdminUseCase(authProvider),
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
}

export const container = new Container();
