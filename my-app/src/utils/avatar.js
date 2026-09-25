import { API_BASE_URL } from "@/config/env";
import defaultAvatar from "@/assets/defaultAvatar.png";

export const getAvatarSrc = (avatarUrl) => {
  if (!avatarUrl?.trim()) return defaultAvatar;

  try {
    return new URL(avatarUrl, API_BASE_URL || window.location.origin).toString();
  } catch {
    return avatarUrl;
  }
};

export const useDefaultAvatarOnError = (event) => {
  if (event.currentTarget.src !== defaultAvatar) {
    event.currentTarget.src = defaultAvatar;
  }
};
