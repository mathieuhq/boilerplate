export type ListUsersInput = {
  sortBy?: string;
  searchValue?: string;
  searchField?: "email" | "name";
  offset?: number;
  sortDirection?: "asc" | "desc";
  limit?: number;
};

export type AdminUserDTO = {
  id: string;
  email: string;
  name: string;
  image?: string;
  role?: string;
};

export type ListUsersOutput = {
  users: AdminUserDTO[];
  total: number;
};
