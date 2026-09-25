import axios from 'axios';
import { API_BASE_URL } from '@/config/env';
import { authStorage } from '@/utils/authStorage';

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  // Let the browser add multipart/form-data together with its generated
  // boundary. Keeping the JSON default here makes ASP.NET reject IFormFile
  // endpoints with 415 before model binding runs.
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }

  const token = authStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Chỉ coi là "hết phiên" khi request có gửi token.
    // Login sai mật khẩu cũng trả 401 nhưng không có token nên bỏ qua.
    if (
      error.response?.status === 401 &&
      error.config?.headers?.Authorization &&
      !error.config?.skipUnauthorizedHandler
    ) {
      authStorage.clear();
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
