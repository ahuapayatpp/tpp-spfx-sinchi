export type UserRole = 'admin' | 'user';

export interface IUserAccess {
  userId: number;
  displayName: string;
  loginName: string;
  isAdmin: boolean;
  role: UserRole;
}

export interface IAccessService {
  getUserAccess(): Promise<IUserAccess>;
}
