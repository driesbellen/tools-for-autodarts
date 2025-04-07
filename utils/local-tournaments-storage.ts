export interface ILocalTournaments {
  show: boolean;
}

export const defaultLocalTournamentsData: ILocalTournaments = {
  show: false,
};

export const AutodartsToolsLocalTournaments: WxtStorageItem<ILocalTournaments, any> = storage.defineItem(
  "local:local-tournaments",
  {
    defaultValue: defaultLocalTournamentsData,
  },
);
