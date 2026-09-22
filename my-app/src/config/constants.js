export const ROLES = Object.freeze({
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
});

export const HOME_PATH_BY_ROLE = Object.freeze({
  [ROLES.ADMIN]: "/users",
  [ROLES.TEACHER]: "/",
  [ROLES.STUDENT]: "/",
});
