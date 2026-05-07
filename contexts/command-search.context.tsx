import { createContext, useContext } from "react";

import { CommandMenu } from "@/components/features/dashboard/command/command-menu";
import { ApplicationError } from "@/shared/domain/errors/application.error";

type SearchContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type SearchProviderProps = {
  value: SearchContextType;
  children: React.ReactNode;
};

const SearchContext = createContext<SearchContextType | null>(null);

export const SearchProvider = ({ children, value }: SearchProviderProps) => {
  return (
    <SearchContext.Provider value={value}>
      {children}
      <CommandMenu />
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const searchContext = useContext(SearchContext);

  if (!searchContext)
    throw new ApplicationError(
      "useSearch has to be used within <SearchContext.Provider>",
    );

  return searchContext;
};
