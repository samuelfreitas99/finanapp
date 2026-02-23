import axios, { AxiosInstance } from 'axios';

// Variável de ambiente para a URL da API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Cliente configurado com suporte a cookies
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Importante para enviar os cookies HTTP-Only em todas as requisições
  headers: {
    'Content-Type': 'application/json',
  },
});

function isAuthPage(): boolean {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname;
  return p.startsWith('/login') || p.startsWith('/register');
}

// Interceptor para tratar respostas e atualizar o token automaticamente
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (isAuthPage()) {
      // Não fica redirectando/recarregando quando o usuário já está tentando logar/cadastrar
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/users/me')) {
      return Promise.reject(error);
    }

    // Se o erro for 401 Unauthorized e a requisição ainda não foi reenviada (para evitar loop infinito)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Se a rota falha for a tentativa de refresh, então o refresh token expirou/inválido.
      if (originalRequest.url.includes('/auth/refresh')) {
        // Redirecionar para login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Tenta renovar o token
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true, headers: { 'Content-Type': 'application/json' } });

        // Se sucesso, os novos cookies foram setados. Reenvia a requisição original
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Falhou em atualizar o token, deslogar o usuário
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
