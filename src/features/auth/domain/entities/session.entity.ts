import { Entity } from "@/shared/domain/entity.base";

export type SessionProps = {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
};

export class Session extends Entity<SessionProps> {
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }

  get userAgent(): string | undefined {
    return this.props.userAgent;
  }

  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }
}
