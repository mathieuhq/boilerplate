export abstract class ValueObject<TProps> {
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    this.props = Object.freeze(props);
  }

  public abstract equals(vo: ValueObject<TProps>): boolean;
}
