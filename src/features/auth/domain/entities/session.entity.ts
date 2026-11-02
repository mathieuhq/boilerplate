import { Entity } from "@/shared/domain/entity.base";

import { UserAgent } from "../value-objects/user-agent.value-object";

export type SessionProps = {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
  impersonatedBy?: string | null;
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

  get device(): UserAgent {
    return UserAgent.parse(this.props.userAgent);
  }

  get lastActiveAt(): Date | undefined {
    return this.props.updatedAt ?? this.props.createdAt;
  }

  get isImpersonation(): boolean {
    return Boolean(this.props.impersonatedBy);
  }

  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  static create(props: SessionProps): Session {
    return new Session(props);
  }
}
