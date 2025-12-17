export abstract class Entity<TProps> {
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    this.props = props;
  }

  public equals(entity: Entity<TProps>): boolean {
    if (this === entity) {
      return true;
    }

    return false;
  }
}
