/**
 * Which export configs a user may see. One rule for every page that lists exports:
 * an export is visible when its `roles` list is empty or shares a role with the user,
 * AND its `users` list is empty or holds the user's Auth0 `sub`.
 */
export function canSeeExport(exp, userRoles = [], userId) {
  const roleOk = !exp?.roles?.length || exp.roles.some((r) => userRoles.includes(r));
  const userOk = !exp?.users?.length || exp.users.includes(userId);
  return roleOk && userOk;
}

export function filterVisibleExports(exports, userRoles, userId) {
  return (Array.isArray(exports) ? exports : []).filter((exp) => canSeeExport(exp, userRoles, userId));
}
