export interface ITeamMember {
  id: number | string;
  displayName: string;
  email?: string;
  loginName?: string;
}

export interface ICollaboratorService {
  getTeamMembers(): Promise<ITeamMember[]>;
}
