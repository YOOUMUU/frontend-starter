import ky from 'ky';

// 使用 Vite 提供的环境变量方式
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/';

// 创建HTTP客户端
export const http = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('token');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return response;
      },
    ],
  },
});
