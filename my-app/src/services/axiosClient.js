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
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Chỉ coi là "hết phiên" khi request có gửi token.
    // Login sai mật khẩu cũng trả 401 nhưng không có token nên bỏ qua.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      authStorage.clear();
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;