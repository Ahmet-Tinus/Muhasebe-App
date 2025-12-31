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

export interface Kategori {
  id?: number;
  ad: string;
  tip: 'gelir' | 'gider';
  created_at?: string;
}

export interface Kasa {
  id: number;
  toplam_tutar: number;
  son_guncelleme: string;
}