export const Role = {
  Admin: 0,
  Client: 1,
  Employee: 2,
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const RoleNames = Object.keys(Role) as (keyof typeof Role)[];