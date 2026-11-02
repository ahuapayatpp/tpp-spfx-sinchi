export interface IActivityOption {
  key: string;
  text: string;
}

export interface IActivityDraft {
  date: string;
  responsibleUser: string;
  activity: string;
  process: string;
  project: string;
  module?: string;
  hu: string;
  hours: number;
}

export interface IActivityRecord extends IActivityDraft {
  id: number;
}

export interface IActivityCatalogs {
  processes: IActivityOption[];
  projects: IActivityOption[];
}
