import { Entity } from "@/shared/domain/entity.base";

export type SubscriptionProps = {
  id: string;
  plan: string;
  status: string;
  seats?: number;
  annual?: boolean;
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
};

export class Subscription extends Entity<SubscriptionProps> {
  get id(): string {
    return this.props.id;
  }

  get plan(): string {
    return this.props.plan;
  }

  get status(): string {
    return this.props.status;
  }

  get seats(): number | undefined {
    return this.props.seats;
  }

  get annual(): boolean | undefined {
    return this.props.annual;
  }

  get periodStart(): Date | undefined {
    return this.props.periodStart;
  }

  get periodEnd(): Date | undefined {
    return this.props.periodEnd;
  }

  get cancelAtPeriodEnd(): boolean | undefined {
    return this.props.cancelAtPeriodEnd;
  }

  get isActive(): boolean {
    return this.props.status === "active";
  }

  get isCanceled(): boolean {
    return this.props.status === "canceled";
  }

  static create(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }
}
