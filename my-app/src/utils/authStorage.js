const SESSION_KEY = "auth_session";

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null; // dữ liệu hỏng thì coi như chưa đăng nhập
  }
};

export const authStorage = {
  get: read,
  set: (session) => localStorage.setItem(SESSION_KEY, JSON.stringify(session)),
  clear: () => localStorage.removeItem(SESSION_KEY),
  getToken: () => read()?.accessToken ?? null,
  isExpired: (session = read()) =>
    !session?.expiresAtUtc ||
    new Date(session.expiresAtUtc).getTime() <= Date.now(),
};
