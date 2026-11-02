import { findSearchMatch } from "@/features/search/domain/search-text";

type Props = {
  text: string;
  term: string;
};

export const SearchHighlight = ({ text, term }: Props) => {
  const match = findSearchMatch(text, term);

  if (!match) return text;

  return (
    <>
      {text.slice(0, match.start)}
      <mark className="bg-transparent font-semibold text-foreground">
        {text.slice(match.start, match.end)}
      </mark>
      {text.slice(match.end)}
    </>
  );
};
