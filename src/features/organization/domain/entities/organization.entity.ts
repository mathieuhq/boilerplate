import { Entity } from "@/shared/domain/entity.base";

export type MemberRole = "owner" | "admin" | "member";

export type OrganizationProps = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
};

export class Organization extends Entity<OrganizationProps> {
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get logo(): string | undefined {
    return this.props.logo;
  }

  static create(props: OrganizationProps): Organization {
    return new Organization(props);
  }
}
