import { useEffect, useState } from 'react';
import { getAylikOzet, getKategoriDagilim, downloadAylikRaporExcel } from '../services/api';
import type { AylikOzet, KategoriDagilim } from '../types';
import { useAuth } from '../contexts/AuthContext';

function Raporlar() {
  const { isAdmin } = useAuth();
  const [aylikOzet, setAylikOzet] = useState<AylikOzet | null>(null);
  const [kategoriDagilim, setKategoriDagilim] = useState<KategoriDagilim[]>([]);
  const [loading, setLoading] = useState(true);
  
// Seçili ay/yıl
  const bugun = new Date();
  const [secilenYil, setSecilenYil] = useState(bugun.getFullYear());
  const [secilenAy, setSecilenAy] = useState(bugun.getMonth() + 1);

  // Dinamik yıl listesi: 2020'den bugüne kadar
  const mevcutYil = bugun.getFullYear();
  const baslangicYil = 2020;
  const yillar = Array.from(
    { length: mevcutYil - baslangicYil + 1 }, 
    (_, i) => baslangicYil + i
  ).reverse(); // En yeni yıllar üstte olsun

  // Verileri yükle
  const loadData = async () => {
    setLoading(true);
    try {
      const [ozetData, dagılımData] = await Promise.all([
        getAylikOzet(secilenYil, secilenAy),
        getKategoriDagilim(secilenYil, secilenAy),
      ]);
      setAylikOzet(ozetData);
      setKategoriDagilim(dagılımData);
    } catch (error) {
      console.error('Rapor yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [secilenYil, secilenAy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  const ayAdlari = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Gelir kategorileri
  const gelirKategorileri = kategoriDagilim.filter(k => k.tip === 'gelir' && parseFloat(k.toplam.toString()) > 0);
  const giderKategorileri = kategoriDagilim.filter(k => k.tip === 'gider' && parseFloat(k.toplam.toString()) > 0);
  
  const toplamGelirKategori = gelirKategorileri.reduce((sum, k) => sum + parseFloat(k.toplam.toString()), 0);
  const toplamGiderKategori = giderKategorileri.reduce((sum, k) => sum + parseFloat(k.toplam.toString()), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Başlık ve Dönem Seçici */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
              <p className="text-gray-500 mt-1">
                {ayAdlari[secilenAy - 1]} {secilenYil} dönemi özeti
              </p>
            </div>
            
            <div className="flex gap-3">
              <select
                value={secilenAy}
                onChange={(e) => setSecilenAy(parseInt(e.target.value))}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium"
              >
                {ayAdlari.map((ay, index) => (
                  <option key={index} value={index + 1}>{ay}</option>
                ))}
              </select>
              
              <select
                value={secilenYil}
                onChange={(e) => setSecilenYil(parseInt(e.target.value))}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium"
              >
                {yillar.map(yil => (
                  <option key={yil} value={yil}>{yil}</option>
                ))}
              </select>
              {isAdmin && (
                <button
                  onClick={() => downloadAylikRaporExcel(secilenYil, secilenAy)}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <span>📥</span>
                  Excel İndir
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Aylık Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* Toplam Gelir */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Toplam Gelir</p>
                <p className="text-xs text-green-500">{aylikOzet?.gelir_adedi} işlem</p>
              </div>
              <div className="w-12 h-12 bg-white/80 backdrop-blur rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ₺{aylikOzet?.toplam_gelir.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Toplam Gider */}
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-6 border border-red-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Toplam Gider</p>
                <p className="text-xs text-red-500">{aylikOzet?.gider_adedi} işlem</p>
              </div>
              <div className="w-12 h-12 bg-white/80 backdrop-blur rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-2xl">💸</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ₺{aylikOzet?.toplam_gider.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Net */}
          <div className={`bg-gradient-to-br rounded-2xl p-6 border ${
            (aylikOzet?.net || 0) >= 0 
              ? 'from-blue-50 to-blue-100/50 border-blue-200' 
              : 'from-orange-50 to-orange-100/50 border-orange-200'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className={`text-sm font-medium mb-1 ${
                  (aylikOzet?.net || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  Net Durum
                </p>
                <p className={`text-xs ${
                  (aylikOzet?.net || 0) >= 0 ? 'text-blue-500' : 'text-orange-500'
                }`}>
                  {(aylikOzet?.gelir_adedi || 0) + (aylikOzet?.gider_adedi || 0)} toplam işlem
                </p>
              </div>
              <div className="w-12 h-12 bg-white/80 backdrop-blur rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-2xl">{(aylikOzet?.net || 0) >= 0 ? '📈' : '📉'}</span>
              </div>
            </div>
            <div className={`text-3xl font-bold ${
              (aylikOzet?.net || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              ₺{aylikOzet?.net.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Kategori Dağılımı */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Gelir Kategorileri */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gelir Kategorileri</h2>
                <p className="text-xs text-gray-500">{gelirKategorileri.length} kategori</p>
              </div>
            </div>
            <div className="space-y-4">
              {gelirKategorileri.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-300 text-4xl mb-2">📊</div>
                  <p className="text-gray-400 text-sm">Bu ay gelir kategorisi yok</p>
                </div>
              ) : (
                gelirKategorileri.map(kategori => {
                  const oran = toplamGelirKategori > 0 
                    ? (parseFloat(kategori.toplam.toString()) / toplamGelirKategori * 100)
                    : 0;
                  
                  return (
                    <div key={kategori.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{kategori.ad || 'Kategorisiz'}</span>
                        <span className="text-sm font-bold text-green-600">
                          ₺{parseFloat(kategori.toplam.toString()).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${oran}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{kategori.adet} işlem</span>
                        <span className="font-semibold">%{oran.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Gider Kategorileri */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">💸</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gider Kategorileri</h2>
                <p className="text-xs text-gray-500">{giderKategorileri.length} kategori</p>
              </div>
            </div>
            <div className="space-y-4">
              {giderKategorileri.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-300 text-4xl mb-2">📊</div>
                  <p className="text-gray-400 text-sm">Bu ay gider kategorisi yok</p>
                </div>
              ) : (
                giderKategorileri.map(kategori => {
                  const oran = toplamGiderKategori > 0 
                    ? (parseFloat(kategori.toplam.toString()) / toplamGiderKategori * 100)
                    : 0;
                  
                  return (
                    <div key={kategori.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{kategori.ad || 'Kategorisiz'}</span>
                        <span className="text-sm font-bold text-red-600">
                          ₺{parseFloat(kategori.toplam.toString()).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div
                          className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${oran}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{kategori.adet} işlem</span>
                        <span className="font-semibold">%{oran.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Raporlar;