export type UserRole = "customer" | "restaurant" | "admin" | "super_admin";

const ROLE_PRIORITY: Record<UserRole, number> = {
  customer: 1,
  restaurant: 2,
  admin: 3,
  super_admin: 4,
};

export const hasAccess = (
  userRole: UserRole | null,
  requiredRole: UserRole
) => {
  if (!userRole) return false;
  return ROLE_PRIORITY[userRole] >= ROLE_PRIORITY[requiredRole];
};
