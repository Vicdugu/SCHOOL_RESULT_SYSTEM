import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    const schoolId = localStorage.getItem('school_id');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (schoolId) {
      config.headers['X-School-ID'] = schoolId;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('school_id');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// API Service Methods

export const authAPI = {
  register: (data: { schoolName: string; email: string; password: string }) =>
    apiClient.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  
  logout: () => apiClient.post('/auth/logout', {}),
  
  refreshToken: () => apiClient.post('/auth/refresh', {}),
};

export const schoolAPI = {
  getSchools: () => apiClient.get('/schools'),
  
  getSchool: (id: string) => apiClient.get(`/schools/${id}`),
  
  createSchool: (data: any) => apiClient.post('/schools', data),
  
  updateSchool: (id: string, data: any) => apiClient.put(`/schools/${id}`, data),
  
  deleteSchool: (id: string) => apiClient.delete(`/schools/${id}`),
};

export const userAPI = {
  getUsers: (params?: any) => apiClient.get('/users', { params }),
  
  getUser: (id: string) => apiClient.get(`/users/${id}`),
  
  createUser: (data: any) => apiClient.post('/users', data),
  
  updateUser: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
  
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    apiClient.post('/users/change-password', data),
};

export const classAPI = {
  getClasses: (params?: any) => apiClient.get('/classes', { params }),
  
  getClass: (id: string) => apiClient.get(`/classes/${id}`),
  
  createClass: (data: any) => apiClient.post('/classes', data),
  
  updateClass: (id: string, data: any) => apiClient.put(`/classes/${id}`, data),
  
  deleteClass: (id: string) => apiClient.delete(`/classes/${id}`),
};

export const pupilAPI = {
  getPupils: (params?: any) => apiClient.get('/pupils', { params }),
  
  getPupil: (id: string) => apiClient.get(`/pupils/${id}`),
  
  createPupil: (data: any) => apiClient.post('/pupils', data),
  
  updatePupil: (id: string, data: any) => apiClient.put(`/pupils/${id}`, data),
  
  deletePupil: (id: string) => apiClient.delete(`/pupils/${id}`),
};

export const resultAPI = {
  getResults: (params?: any) => apiClient.get('/results', { params }),
  
  getResult: (id: string) => apiClient.get(`/results/${id}`),
  
  createResult: (data: any) => apiClient.post('/results', data),
  
  updateResult: (id: string, data: any) => apiClient.put(`/results/${id}`, data),
  
  deleteResult: (id: string) => apiClient.delete(`/results/${id}`),
  
  exportResults: (params?: any) => apiClient.get('/results/export', { params }),
};

export const subjectAPI = {
  getSubjects: (params?: any) => apiClient.get('/subjects', { params }),
  
  getSubject: (id: string) => apiClient.get(`/subjects/${id}`),
  
  createSubject: (data: any) => apiClient.post('/subjects', data),
  
  updateSubject: (id: string, data: any) => apiClient.put(`/subjects/${id}`, data),
  
  deleteSubject: (id: string) => apiClient.delete(`/subjects/${id}`),
};

export default apiClient;
