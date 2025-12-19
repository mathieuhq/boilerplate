export type DailyRegistrationStat = {
  date: string;
  count: number;
};

export type IAdminRepository = {
  getRegistrationsByDay: (days: number) => Promise<DailyRegistrationStat[]>;
};
