import { ValueObject } from "@/shared/domain/value-object.base";

import { InvalidSearchTermError } from "../errors/invalid-search-term.error";

type SearchTermProps = {
  value: string;
};

export const SEARCH_TERM_MIN_LENGTH = 2;
export const SEARCH_TERM_MAX_LENGTH = 100;

export class SearchTerm extends ValueObject<SearchTermProps> {
  private constructor(props: SearchTermProps) {
    super(props);
  }

  static create(raw: string): SearchTerm {
    const value = raw.trim().replace(/\s+/g, " ");

    if (
      value.length < SEARCH_TERM_MIN_LENGTH ||
      value.length > SEARCH_TERM_MAX_LENGTH
    )
      throw new InvalidSearchTermError(
        SEARCH_TERM_MIN_LENGTH,
        SEARCH_TERM_MAX_LENGTH,
      );

    return new SearchTerm({ value });
  }

  get value(): string {
    return this.props.value;
  }

  equals(vo: ValueObject<SearchTermProps>): boolean {
    return vo instanceof SearchTerm && vo.value === this.value;
  }
}
