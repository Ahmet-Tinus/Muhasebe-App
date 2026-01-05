import axios from 'axios';
import type { Islem, Kasa, Varlik, Kategori, AylikOzet, KategoriDagilim, BekleyenPos, AuditLog } from '../types';

const API_BASE_URL = 'https://muhasebe-app-o6sn.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios interceptor - Her isteğe token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios interceptor - 401 hatalarında logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Kasa
export const getKasa = async (): Promise<Kasa> => {
  const response = await api.get('/kasa');
  return response.data;
};

// Varlık
export const getVarlik = async (): Promise<Varlik> => {
  const response = await api.get('/kasa/varlik');
  return response.data;
};
// Bekleyen POS
export const getBekleyenPos = async (): Promise<BekleyenPos[]> => {
  const response = await api.get('/kasa/bekleyen-pos');
  return response.data;
};
// İşlemler
export const getIslemler = async (): Promise<Islem[]> => {
  const response = await api.get('/islemler');
  return response.data;
};

export const addIslem = async (islem: Islem): Promise<Islem> => {
  const response = await api.post('/islemler', islem);
  return response.data;
};

export const deleteIslem = async (id: number): Promise<void> => {
  await api.delete(`/islemler/${id}`);
};

// Kategoriler
export const getKategoriler = async (): Promise<Kategori[]> => {
  const response = await api.get('/kategoriler');
  return response.data;
};

export const addKategori = async (kategori: Kategori): Promise<Kategori> => {
  const response = await api.post('/kategoriler', kategori);
  return response.data;
};

export const deleteKategori = async (id: number): Promise<void> => {
  await api.delete(`/kategoriler/${id}`);
};

// Raporlar
export const getAylikOzet = async (yil?: number, ay?: number): Promise<AylikOzet> => {
  const params = new URLSearchParams();
  if (yil) params.append('yil', yil.toString());
  if (ay) params.append('ay', ay.toString());
  
  const response = await api.get(`/raporlar/aylik-ozet?${params.toString()}`);
  return response.data;
};

export const getKategoriDagilim = async (yil?: number, ay?: number): Promise<KategoriDagilim[]> => {
  const params = new URLSearchParams();
  if (yil) params.append('yil', yil.toString());
  if (ay) params.append('ay', ay.toString());
  
  const response = await api.get(`/raporlar/kategori-dagilim?${params.toString()}`);
  return response.data;
};

// Excel Export
export const downloadIslemlerExcel = async (baslangic?: string, bitis?: string) => {
  const params = new URLSearchParams();
  if (baslangic) params.append('baslangic', baslangic);
  if (bitis) params.append('bitis', bitis);
  
  const response = await api.get(`/excel/islemler?${params.toString()}`, {
    responseType: 'blob'
  });
  
  // Dosyayı indir
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `islemler_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadAylikRaporExcel = async (yil?: number, ay?: number) => {
  const params = new URLSearchParams();
  if (yil) params.append('yil', yil.toString());
  if (ay) params.append('ay', ay.toString());
  
  const response = await api.get(`/excel/aylik-rapor?${params.toString()}`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `rapor_${yil || new Date().getFullYear()}_${String(ay || new Date().getMonth() + 1).padStart(2, '0')}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};


// Audit Logs
export const getAuditLogs = async (filters?: {
  userId?: number;
  tableName?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<AuditLog[]> => {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId.toString());
  if (filters?.tableName) params.append('tableName', filters.tableName);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const response = await api.get(`/audit/logs?${params.toString()}`);
  return response.data;
};


// Kullanıcı Yönetimi
export const getAllUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

export const createUser = async (data: {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'viewer';
}) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const deleteUser = async (userId: number) => {
  const response = await api.delete(`/auth/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId: number, data: {
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'viewer';
}) => {
  const response = await api.put(`/auth/users/${userId}`, data);
  return response.data;
};