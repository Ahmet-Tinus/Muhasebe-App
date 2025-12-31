export interface Islem {
  id?: number;
  kategori_id?: number;
  tutar: number;
  aciklama?: string;
  tip: 'gelir' | 'gider';
  gelir_tipi?: 'normal' | 'pos';
  tarih: string;
  kasa_yansima_tarihi?: string;
  created_at?: string;
}

export interface Kasa {
  id: number;
  toplam_tutar: number;
  son_guncelleme: string;
}

export interface Varlik {
  toplam_tutar: number;
  bekleyen_pos: number;
  gerceklesen: number;
}

export interface Kategori {
  id?: number;
  ad: string;
  tip: 'gelir' | 'gider';
  created_at?: string;
}

export interface AylikOzet {
  yil: number;
  ay: number;
  toplam_gelir: number;
  toplam_gider: number;
  net: number;
  gelir_adedi: number;
  gider_adedi: number;
}

export interface KategoriDagilim {
  id: number;
  ad: string;
  tip: 'gelir' | 'gider';
  toplam: number;
  adet: number;
}

export interface BekleyenPos {
  id: number;
  tutar: string;
  aciklama?: string;
  tarih: string;
  kasa_yansima_tarihi: string;
  kalan_gun: number;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_email: string;
  user_name?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  table_name: string;
  record_id?: number;
old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}