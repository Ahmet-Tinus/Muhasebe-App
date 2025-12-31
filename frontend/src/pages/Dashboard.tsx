import { useEffect, useState } from "react";
import { getKasa, getVarlik, getIslemler, addIslem, deleteIslem, getKategoriler, addKategori, deleteKategori, downloadIslemlerExcel, getBekleyenPos } from "../services/api";
import type { Islem, Kasa, Varlik, Kategori, BekleyenPos } from "../types";
import { useAuth } from '../contexts/AuthContext';


function Dashboard() {
  const { isAdmin } = useAuth();
  const [kasa, setKasa] = useState<Kasa | null>(null);
  const [varlik, setVarlik] = useState<Varlik | null>(null);
  const [islemler, setIslemler] = useState<Islem[]>([]);
  const [loading, setLoading] = useState(true);
const [bekleyenPos, setBekleyenPos] = useState<BekleyenPos[]>([]);
  // Form state
  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [tip, setTip] = useState<"gelir" | "gider">("gelir");
  const [gelirTipi, setGelirTipi] = useState<"normal" | "pos">("normal");
  const [tarih, setTarih] = useState(new Date().toISOString().split("T")[0]);
  
  // Kategori state
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [kategoriId, setKategoriId] = useState<number | undefined>(undefined);
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [yeniKategoriAd, setYeniKategoriAd] = useState("");
  const [yeniKategoriTip, setYeniKategoriTip] = useState<"gelir" | "gider">("gelir");
  
  // Modal state
  const [showIslemModal, setShowIslemModal] = useState(false);
  
  // Filtreleme state'leri
  const [filterTip, setFilterTip] = useState<"all" | "gelir" | "gider">("all");
  const [filterKategori, setFilterKategori] = useState<number | "all">("all");
  const [filterGelirTipi, setFilterGelirTipi] = useState<"all" | "normal" | "pos">("all");
  const [filterTarihBaslangic, setFilterTarihBaslangic] = useState("");
  const [filterTarihBitis, setFilterTarihBitis] = useState("");

  // Verileri yükle
const loadData = async () => {
  try {
    const [kasaData, varlikData, islemlerData, kategorilerData, bekleyenPosData] = await Promise.all([
      getKasa(), 
      getVarlik(), 
      getIslemler(), 
      getKategoriler(),
      getBekleyenPos()
    ]);
    setKasa(kasaData);
    setVarlik(varlikData);
    setIslemler(islemlerData);
    setKategoriler(kategorilerData);
    setBekleyenPos(bekleyenPosData);
  } catch (error) {
    console.error("Veri yükleme hatası:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadData();
  }, []);

  // Yeni işlem ekle
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tutar || parseFloat(tutar) <= 0) {
      alert("Lütfen geçerli bir tutar girin");
      return;
    }

    try {
      await addIslem({
        kategori_id: kategoriId,
        tutar: parseFloat(tutar),
        aciklama,
        tip,
        gelir_tipi: tip === "gelir" ? gelirTipi : undefined,
        tarih,
      });

      // Formu temizle
      setTutar("");
      setAciklama("");
      setKategoriId(undefined);
      setTarih(new Date().toISOString().split("T")[0]);
      setShowIslemModal(false); // Modal'ı kapat

      // Verileri yenile
      loadData();
    } catch (error) {
      console.error("İşlem eklenirken hata:", error);
      alert("İşlem eklenemedi");
    }
  };

  // İşlem sil
  const handleDelete = async (id: number) => {
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;

    try {
      await deleteIslem(id);
      loadData();
    } catch (error) {
      console.error("İşlem silinirken hata:", error);
      alert("İşlem silinemedi");
    }
  };

  // Kategori ekle
  const handleAddKategori = async () => {
    if (!yeniKategoriAd.trim()) {
      alert("Kategori adı gerekli");
      return;
    }

    try {
      await addKategori({
        ad: yeniKategoriAd,
        tip: yeniKategoriTip,
      });

      setYeniKategoriAd("");
      setShowKategoriModal(false);
      loadData();
    } catch (error) {
      console.error("Kategori eklenirken hata:", error);
      alert("Kategori eklenemedi");
    }
  };

  // Kategori sil
  const handleDeleteKategori = async (id: number) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;

    try {
      await deleteKategori(id);
      loadData();
    } catch (error) {
      console.error("Kategori silinirken hata:", error);
      alert("Kategori silinemedi. Bu kategoriye bağlı işlemler olabilir.");
    }
  };

  // Filtrelenmiş işlemler
  const filteredIslemler = islemler.filter((islem) => {
    if (filterTip !== "all" && islem.tip !== filterTip) return false;
    if (filterKategori !== "all" && islem.kategori_id !== filterKategori) return false;
    if (filterGelirTipi !== "all" && islem.tip === "gelir") {
      if (islem.gelir_tipi !== filterGelirTipi) return false;
    }
    if (filterTarihBaslangic && islem.tarih < filterTarihBaslangic) return false;
    if (filterTarihBitis && islem.tarih > filterTarihBitis) return false;
    return true;
  });

  // Hızlı tarih filtreleri
  const setTarihFiltresi = (tip: "bugun" | "bu-hafta" | "bu-ay" | "temizle") => {
    const bugun = new Date();
    const getLocalDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (tip === "temizle") {
      setFilterTarihBaslangic("");
      setFilterTarihBitis("");
      return;
    }

    if (tip === "bugun") {
      const tarih = getLocalDateString(bugun);
      const dun = new Date(bugun);
      dun.setDate(dun.getDate() - 1);
      setFilterTarihBaslangic(getLocalDateString(dun));
      setFilterTarihBitis(tarih);
    } else if (tip === "bu-hafta") {
      const haftaninBaslangici = new Date(bugun);
      haftaninBaslangici.setDate(bugun.getDate() - bugun.getDay() + 1);
      setFilterTarihBaslangic(getLocalDateString(haftaninBaslangici));
      setFilterTarihBitis(getLocalDateString(bugun));
    } else if (tip === "bu-ay") {
      const ayinBaslangici = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
      setFilterTarihBaslangic(getLocalDateString(ayinBaslangici));
      setFilterTarihBitis(getLocalDateString(bugun));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Kasa ve Varlık Durumu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
          {/* Kasa */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-600">Kasa (Gerçekleşen)</h2>
            <div className="text-4xl font-bold text-blue-600">
              ₺{parseFloat(kasa?.toplam_tutar.toString() || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Son güncelleme: {kasa && new Date(kasa.son_guncelleme).toLocaleString("tr-TR")}
            </p>
          </div>

          {/* Varlık */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-600">Toplam Varlık</h2>
            <div className="text-4xl font-bold text-green-600">
              ₺{parseFloat(varlik?.toplam_tutar.toString() || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Bekleyen POS:</span> ₺{parseFloat(varlik?.bekleyen_pos.toString() || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Gerçekleşen:</span> ₺{parseFloat(varlik?.gerceklesen.toString() || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

{/* Yeni İşlem Ekle Butonu */}
        {isAdmin && (
          <div className="mb-6">
            <button
              onClick={() => setShowIslemModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <span className="text-2xl">+</span>
              Yeni İşlem Ekle
            </button>
          </div>
        )}

        {/* Bekleyen POS Ödemeleri Widget */}
        {bekleyenPos.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-6 border border-amber-200 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/80 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-xl">⏱️</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Bekleyen POS Ödemeleri</h3>
                <p className="text-xs text-amber-600">{bekleyenPos.length} ödeme kasaya yansımayı bekliyor</p>
              </div>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {bekleyenPos.map(pos => (
                <div 
                  key={pos.id} 
                  className={`p-3 rounded-xl border-2 transition-all ${
                    pos.kalan_gun <= 3 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-white border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900">
                      ₺{parseFloat(pos.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      pos.kalan_gun <= 3 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-amber-200 text-amber-800'
                    }`}>
                      {pos.kalan_gun} gün kaldı
                    </span>
                  </div>
                  {pos.aciklama && (
                    <p className="text-xs text-gray-600 mb-1">{pos.aciklama}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>İşlem: {new Date(pos.tarih).toLocaleDateString('tr-TR')}</span>
                    <span className={pos.kalan_gun <= 3 ? 'text-green-600 font-semibold' : ''}>
                      Kasaya: {new Date(pos.kasa_yansima_tarihi).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* İşlem Listesi - Tam Genişlik */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Son İşlemler</h2>
            {isAdmin && (
              <button
                onClick={() => downloadIslemlerExcel(filterTarihBaslangic, filterTarihBitis)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2 text-sm"
              >
                <span>📥</span>
                Excel'e Aktar
              </button>
            )}
          </div>
          
          {/* Filtreleme */}
          <div className="mb-6 space-y-4 pb-6 border-b border-gray-200">
            {/* Hızlı Tarih Filtreleri */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setTarihFiltresi("bugun")} 
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  Bugün
                </button>
                <button 
                  onClick={() => setTarihFiltresi("bu-hafta")} 
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  Bu Hafta
                </button>
                <button 
                  onClick={() => setTarihFiltresi("bu-ay")} 
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  Bu Ay
                </button>
                <button 
                  onClick={() => setTarihFiltresi("temizle")} 
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Temizle
                </button>
              </div>

              <div className="text-sm font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
                {filteredIslemler.length} / {islemler.length} işlem
              </div>
            </div>

            {/* Filtre Seçenekleri */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <select
                value={filterTip}
                onChange={(e) => setFilterTip(e.target.value as "all" | "gelir" | "gider")}
                className="px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">📊 Tüm İşlemler</option>
                <option value="gelir">💰 Gelir</option>
                <option value="gider">💸 Gider</option>
              </select>

              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                className="px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">📁 Tüm Kategoriler</option>
                {kategoriler.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ad}
                  </option>
                ))}
              </select>

              <select
                value={filterGelirTipi}
                onChange={(e) => setFilterGelirTipi(e.target.value as "all" | "normal" | "pos")}
                disabled={filterTip !== "gelir"}
                className="px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="all">💳 Tüm Gelir Tipleri</option>
                <option value="normal">⚡ Normal</option>
                <option value="pos">💳 POS</option>
              </select>
            </div>

            {/* Özel Tarih Aralığı */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={filterTarihBaslangic}
                onChange={(e) => setFilterTarihBaslangic(e.target.value)}
                className="px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={filterTarihBitis}
                onChange={(e) => setFilterTarihBitis(e.target.value)}
                className="px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* İşlem Kartları */}
{/* İşlem Tablosu */}
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredIslemler.length === 0 ? (
                <div className="text-center py-12 bg-white">
                  <div className="text-gray-400 text-5xl mb-3">📋</div>
                  <p className="text-gray-500 font-medium">Henüz işlem yok</p>
                  <p className="text-gray-400 text-sm mt-1">Yeni işlem ekleyerek başlayın</p>
                </div>
              ) : (
                <table className="w-full">
                  {/* Başlık */}
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tip
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Açıklama
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tutar
                      </th>
                      {isAdmin && (
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                          İşlem
                        </th>
                      )}
                    </tr>
                  </thead>

                  {/* Satırlar */}
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredIslemler.map((islem) => (
                      <tr 
                        key={islem.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        {/* Tarih */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(islem.tarih).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        {/* Tip */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                              islem.tip === 'gelir'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {islem.tip === 'gelir' ? 'Gelir' : 'Gider'}
                            </span>
                            {islem.gelir_tipi === 'pos' && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                                POS
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {kategoriler.find(k => k.id === islem.kategori_id)?.ad || '-'}
                        </td>

                        {/* Açıklama */}
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {islem.aciklama || '-'}
                        </td>

                        {/* Tutar */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className={`text-sm font-bold ${
                            islem.tip === 'gelir' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {islem.tip === 'gelir' ? '+' : '-'}₺{parseFloat(islem.tutar.toString()).toLocaleString('tr-TR', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </span>
                          {islem.kasa_yansima_tarihi && islem.gelir_tipi === 'pos' && (
                            <div className="text-xs text-gray-500 mt-1">
                              Kasaya: {new Date(islem.kasa_yansima_tarihi).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </div>
                          )}
                        </td>

                        {/* Sil Butonu - Sadece Admin */}
                        {isAdmin && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => islem.id && handleDelete(islem.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Sil
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

{/* İşlem Ekleme Modal */}
      {showIslemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header - Sabit */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-bold text-white">Yeni İşlem Ekle</h3>
              <button
                onClick={() => setShowIslemModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* İşlem Tipi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    İşlem Tipi
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      tip === 'gelir' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="gelir"
                        checked={tip === 'gelir'}
                        onChange={(e) => setTip(e.target.value as 'gelir')}
                        className="sr-only"
                      />
                      <span className={`font-medium ${tip === 'gelir' ? 'text-green-700' : 'text-gray-600'}`}>
                        ✓ Gelir
                      </span>
                    </label>
                    <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      tip === 'gider' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="gider"
                        checked={tip === 'gider'}
                        onChange={(e) => setTip(e.target.value as 'gider')}
                        className="sr-only"
                      />
                      <span className={`font-medium ${tip === 'gider' ? 'text-red-700' : 'text-gray-600'}`}>
                        − Gider
                      </span>
                    </label>
                  </div>
                </div>

                {/* Gelir Tipi */}
                {tip === 'gelir' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Gelir Tipi
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        gelirTipi === 'normal' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          value="normal"
                          checked={gelirTipi === 'normal'}
                          onChange={(e) => setGelirTipi(e.target.value as 'normal')}
                          className="sr-only"
                        />
                        <span className={`text-sm font-medium ${gelirTipi === 'normal' ? 'text-blue-700' : 'text-gray-600'}`}>
                          Normal (Anında)
                        </span>
                      </label>
                      <label className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        gelirTipi === 'pos' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          value="pos"
                          checked={gelirTipi === 'pos'}
                          onChange={(e) => setGelirTipi(e.target.value as 'pos')}
                          className="sr-only"
                        />
                        <span className={`text-sm font-medium ${gelirTipi === 'pos' ? 'text-blue-700' : 'text-gray-600'}`}>
                          POS (13 Gün)
                        </span>
                      </label>
                    </div>
                    {gelirTipi === 'pos' && (
                      <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                        <span>ℹ️</span>
                        POS ödemesi kasaya 13 gün sonra yansıyacak
                      </p>
                    )}
                  </div>
                )}

                {/* Tutar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tutar (₺)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tutar}
                    onChange={(e) => {
                      const value = e.target.value.replace(',', '.');
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setTutar(value);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <input
                    type="text"
                    value={aciklama}
                    onChange={(e) => setAciklama(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="İşlem açıklaması (opsiyonel)"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Kategori (Opsiyonel)
                    </label>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowKategoriModal(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Yeni Kategori
                      </button>
                    )}
                  </div>
                  <select
                    value={kategoriId || ''}
                    onChange={(e) => setKategoriId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Kategori Seçiniz</option>
                    {kategoriler
                      .filter(k => k.tip === tip)
                      .map(kategori => (
                        <option key={kategori.id} value={kategori.id}>
                          {kategori.ad}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Tarih */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={tarih}
                    onChange={(e) => setTarih(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  İşlem Ekle
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Kategori Modal */}
      {showKategoriModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Kategori Yönetimi</h3>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={yeniKategoriAd}
                    onChange={(e) => setYeniKategoriAd(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Maaş, Kira, Elektrik"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tip
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      yeniKategoriTip === 'gelir' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="gelir"
                        checked={yeniKategoriTip === 'gelir'}
                        onChange={(e) => setYeniKategoriTip(e.target.value as 'gelir')}
                        className="sr-only"
                      />
                      <span className={`font-medium ${yeniKategoriTip === 'gelir' ? 'text-green-700' : 'text-gray-600'}`}>
                        Gelir
                      </span>
                    </label>
                    <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      yeniKategoriTip === 'gider' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="gider"
                        checked={yeniKategoriTip === 'gider'}
                        onChange={(e) => setYeniKategoriTip(e.target.value as 'gider')}
                        className="sr-only"
                      />
                      <span className={`font-medium ${yeniKategoriTip === 'gider' ? 'text-red-700' : 'text-gray-600'}`}>
                        Gider
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleAddKategori}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md"
                  >
                    Ekle
                  </button>
                  <button
                    onClick={() => {
                      setShowKategoriModal(false);
                      setYeniKategoriAd('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    İptal
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📂</span>
                  Mevcut Kategoriler ({kategoriler.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {kategoriler.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">
                      Henüz kategori eklenmemiş
                    </p>
                  ) : (
                    kategoriler.map(kategori => (
                      <div 
                        key={kategori.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            kategori.tip === 'gelir' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {kategori.tip === 'gelir' ? '↑' : '↓'}
                          </span>
                          <div>
                            <span className="font-medium text-gray-900">{kategori.ad}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                              kategori.tip === 'gelir' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {kategori.tip}
                            </span>
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => kategori.id && handleDeleteKategori(kategori.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;