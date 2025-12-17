export type ListUsersInput = {
  limit?: number;
  sortBy?: string;
  offset?: number;
  searchValue?: string;
  searchField?: "email" | "name";
  sortDirection?: "asc" | "desc";
};

export type AdminUserDTO = {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string;
};

export type ListUsersOutput = {
  total: number;
  users: AdminUserDTO[];
};
