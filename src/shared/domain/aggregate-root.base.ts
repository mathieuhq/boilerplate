import { Entity } from "./entity.base";

export abstract class AggregateRoot<TProps> extends Entity<TProps> {
  protected constructor(props: TProps) {
    super(props);
  }
}
