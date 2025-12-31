import { useEffect, useState } from "react";
import { getKasa, getVarlik, getIslemler, addIslem, deleteIslem, getKategoriler, addKategori, deleteKategori } from "../services/api";
import type { Islem, Kasa, Varlik, Kategori } from "../types";

function Dashboard() {
  const [kasa, setKasa] = useState<Kasa | null>(null);
  const [varlik, setVarlik] = useState<Varlik | null>(null);
  const [islemler, setIslemler] = useState<Islem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [tip, setTip] = useState<"gelir" | "gider">("gelir");
  const [gelirTipi, setGelirTipi] = useState<"normal" | "pos">("normal");
  const [tarih, setTarih] = useState(new Date().toISOString().split("T")[0]);
  //Kategori state
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [kategoriId, setKategoriId] = useState<number | undefined>(undefined);
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [yeniKategoriAd, setYeniKategoriAd] = useState("");
  const [yeniKategoriTip, setYeniKategoriTip] = useState<"gelir" | "gider">("gelir");
  // Filtreleme state'leri
  const [filterTip, setFilterTip] = useState<"all" | "gelir" | "gider">("all");
  const [filterKategori, setFilterKategori] = useState<number | "all">("all");
  const [filterGelirTipi, setFilterGelirTipi] = useState<"all" | "normal" | "pos">("all");
  const [filterTarihBaslangic, setFilterTarihBaslangic] = useState("");
  const [filterTarihBitis, setFilterTarihBitis] = useState("");
  // Verileri yükle
  const loadData = async () => {
    try {
      const [kasaData, varlikData, islemlerData, kategorilerData] = await Promise.all([getKasa(), getVarlik(), getIslemler(), getKategoriler()]);
      setKasa(kasaData);
      setVarlik(varlikData);
      setIslemler(islemlerData);
      setKategoriler(kategorilerData);
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
    // Tip filtresi
    if (filterTip !== "all" && islem.tip !== filterTip) return false;

    // Kategori filtresi
    if (filterKategori !== "all" && islem.kategori_id !== filterKategori) return false;

    // Gelir tipi filtresi
    if (filterGelirTipi !== "all" && islem.tip === "gelir") {
      if (islem.gelir_tipi !== filterGelirTipi) return false;
    }

    // Tarih filtresi - başlangıç
    if (filterTarihBaslangic && islem.tarih < filterTarihBaslangic) return false;

    // Tarih filtresi - bitiş
    if (filterTarihBitis && islem.tarih > filterTarihBitis) return false;

    return true;
  });
  // Hızlı tarih filtreleri
  // Hızlı tarih filtreleri
  const setTarihFiltresi = (tip: "bugun" | "bu-hafta" | "bu-ay" | "temizle") => {
    const bugun = new Date();

    // Local tarihi al (Türkiye saati)
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
      dun.setDate(dun.getDate() - 1); // Bir gün geriye al

      setFilterTarihBaslangic(getLocalDateString(dun)); // Dün
      setFilterTarihBitis(tarih); // Bugün
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Kasa ve Varlık Durumu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Kasa */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-600">Kasa (Gerçekleşen)</h2>
            <div className="text-4xl font-bold text-blue-600">₺{parseFloat(kasa?.toplam_tutar.toString() || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-sm text-gray-500 mt-2">Son güncelleme: {kasa && new Date(kasa.son_guncelleme).toLocaleString("tr-TR")}</p>
          </div>

          {/* Varlık */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-600">Toplam Varlık</h2>
            <div className="text-4xl font-bold text-green-600">₺{parseFloat(varlik?.toplam_tutar.toString() || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Bekleyen POS:</span> ₺{varlik?.bekleyen_pos.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Gerçekleşen:</span> ₺{varlik?.gerceklesen.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yeni İşlem Formu */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Yeni İşlem Ekle</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İşlem Tipi</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input type="radio" value="gelir" checked={tip === "gelir"} onChange={(e) => setTip(e.target.value as "gelir")} className="mr-2" />
                    Gelir
                  </label>
                  <label className="flex items-center">
                    <input type="radio" value="gider" checked={tip === "gider"} onChange={(e) => setTip(e.target.value as "gider")} className="mr-2" />
                    Gider
                  </label>
                </div>
              </div>

              {/* Gelir Tipi - Sadece gelir seçiliyse göster */}
              {tip === "gelir" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gelir Tipi</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input type="radio" value="normal" checked={gelirTipi === "normal"} onChange={(e) => setGelirTipi(e.target.value as "normal")} className="mr-2" />
                      Normal (Anında)
                    </label>
                    <label className="flex items-center">
                      <input type="radio" value="pos" checked={gelirTipi === "pos"} onChange={(e) => setGelirTipi(e.target.value as "pos")} className="mr-2" />
                      POS (13 Gün)
                    </label>
                  </div>
                  {gelirTipi === "pos" && <p className="text-xs text-blue-600 mt-1">ℹ️ POS ödemesi kasaya 13 gün sonra yansıyacak</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tutar (₺)</label>
                <input
                  type="number"
                  value={tutar}
                  onChange={(e) => setTutar(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <input
                  type="text"
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="İşlem açıklaması"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Kategori (Opsiyonel)</label>
                  <button type="button" onClick={() => setShowKategoriModal(true)} className="text-xs text-blue-600 hover:text-blue-800">
                    + Yeni Kategori
                  </button>
                </div>
                <select
                  value={kategoriId || ""}
                  onChange={(e) => setKategoriId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Kategori Seçiniz</option>
                  {kategoriler
                    .filter((k) => k.tip === tip)
                    .map((kategori) => (
                      <option key={kategori.id} value={kategori.id}>
                        {kategori.ad}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                <input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                İşlem Ekle
              </button>
            </form>
          </div>

          {/* İşlem Listesi */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Son İşlemler</h2>
            {/* ↓↓↓ FİLTRELEME BÖLÜMÜ BURAYA ↓↓↓ */}
            <div className="mb-4 space-y-3 pb-4 border-b">
              {/* Hızlı Tarih Filtreleri */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                  <button onClick={() => setTarihFiltresi("bugun")} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Bugün
                  </button>
                  <button onClick={() => setTarihFiltresi("bu-hafta")} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Bu Hafta
                  </button>
                  <button onClick={() => setTarihFiltresi("bu-ay")} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Bu Ay
                  </button>
                  <button onClick={() => setTarihFiltresi("temizle")} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Temizle
                  </button>
                </div>

                {/* İşlem Adedi - Sağa */}
                <div className="text-sm font-medium text-gray-600">
                  {filteredIslemler.length} / {islemler.length} işlem
                </div>
              </div>

              {/* Filtre Seçenekleri */}
              <div className="grid grid-cols-3 gap-2">
                {/* Tip Filtresi */}
                <select
                  value={filterTip}
                  onChange={(e) => setFilterTip(e.target.value as "all" | "gelir" | "gider")}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tüm İşlemler</option>
                  <option value="gelir">Gelir</option>
                  <option value="gider">Gider</option>
                </select>

                {/* Kategori Filtresi */}
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tüm Kategoriler</option>
                  {kategoriler.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.ad}
                    </option>
                  ))}
                </select>

                {/* Gelir Tipi Filtresi */}
                <select
                  value={filterGelirTipi}
                  onChange={(e) => setFilterGelirTipi(e.target.value as "all" | "normal" | "pos")}
                  disabled={filterTip !== "gelir"}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="all">Tüm Gelir Tipleri</option>
                  <option value="normal">Normal</option>
                  <option value="pos">POS</option>
                </select>
              </div>

              {/* Özel Tarih Aralığı */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filterTarihBaslangic}
                  onChange={(e) => setFilterTarihBaslangic(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Başlangıç"
                />
                <input
                  type="date"
                  value={filterTarihBitis}
                  onChange={(e) => setFilterTarihBitis(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Bitiş"
                />
              </div>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {islemler.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Henüz işlem yok</p>
              ) : (
                filteredIslemler.map((islem) => (
                  <div key={islem.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${islem.tip === "gelir" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {islem.tip.toUpperCase()}
                        </span>
                        {islem.gelir_tipi === "pos" && <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">POS</span>}
                        <span className="font-semibold">₺{islem.tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      {islem.aciklama && <p className="text-sm text-gray-600 mt-1">{islem.aciklama}</p>}
                      <div className="flex gap-4 text-xs text-gray-400 mt-1">
                        <span>İşlem: {new Date(islem.tarih).toLocaleDateString("tr-TR")}</span>
                        {islem.kasa_yansima_tarihi && islem.gelir_tipi === "pos" && <span className="text-blue-600">Kasaya: {new Date(islem.kasa_yansima_tarihi).toLocaleDateString("tr-TR")}</span>}
                      </div>
                    </div>
                    <button onClick={() => islem.id && handleDelete(islem.id)} className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium">
                      Sil
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kategori Modal - BURAYA EKLE */}
      {showKategoriModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Yeni Kategori Ekle</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Adı</label>
                <input
                  type="text"
                  value={yeniKategoriAd}
                  onChange={(e) => setYeniKategoriAd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Maaş, Kira, Elektrik"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tip</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input type="radio" value="gelir" checked={yeniKategoriTip === "gelir"} onChange={(e) => setYeniKategoriTip(e.target.value as "gelir")} className="mr-2" />
                    Gelir
                  </label>
                  <label className="flex items-center">
                    <input type="radio" value="gider" checked={yeniKategoriTip === "gider"} onChange={(e) => setYeniKategoriTip(e.target.value as "gider")} className="mr-2" />
                    Gider
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button onClick={handleAddKategori} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                  Ekle
                </button>
                <button
                  onClick={() => {
                    setShowKategoriModal(false);
                    setYeniKategoriAd("");
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
                >
                  İptal
                </button>
              </div>
            </div>

            {/* Mevcut Kategoriler */}
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Mevcut Kategoriler</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {kategoriler.map((kategori) => (
                  <div key={kategori.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{kategori.ad}</span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded ${kategori.tip === "gelir" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{kategori.tip}</span>
                    </div>
                    <button onClick={() => kategori.id && handleDeleteKategori(kategori.id)} className="text-red-600 hover:text-red-800 text-sm">
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
