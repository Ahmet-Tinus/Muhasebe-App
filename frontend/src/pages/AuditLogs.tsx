import { useEffect, useState } from "react";
import { getAuditLogs } from "../services/api";
import type { AuditLog } from "../types";

function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filters = {
        tableName: filterTable !== "all" ? filterTable : undefined,
        action: filterAction !== "all" ? filterAction : undefined,
        limit: 100,
      };
      const data = await getAuditLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error("Loglar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filterTable, filterAction]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    const styles = {
      CREATE: "bg-green-100 text-green-700 border-green-200",
      UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
      DELETE: "bg-red-100 text-red-700 border-red-200",
      LOGIN: "bg-purple-100 text-purple-700 border-purple-200", // ← EKLE
    };
    return styles[action as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  const getTableName = (name: string) => {
    const names: Record<string, string> = {
      islemler: "İşlemler",
      kategoriler: "Kategoriler",
      users: "Kullanıcılar",
    };
    return names[name] || name;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Başlık */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">İşlem Logları</h1>
              <p className="text-gray-500 mt-1">Tüm sistem aktiviteleri</p>
            </div>
          </div>

          {/* Filtreler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white font-medium"
            >
              <option value="all">🎯 Tüm İşlemler</option>
              <option value="CREATE">✅ Ekleme</option>
              <option value="UPDATE">✏️ Güncelleme</option>
              <option value="DELETE">🗑️ Silme</option>
              <option value="LOGIN">🔐 Giriş</option>
            </select>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white font-medium"
            >
              <option value="all">🎯 Tüm İşlemler</option>
              <option value="CREATE">✅ Ekleme</option>
              <option value="UPDATE">✏️ Güncelleme</option>
              <option value="DELETE">🗑️ Silme</option>
            </select>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Toplam <span className="font-bold">{logs.length}</span> kayıt
          </div>
        </div>

        {/* Loglar */}
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-gray-300 text-5xl mb-3">📋</div>
              <p className="text-gray-500 font-medium">Henüz log kaydı yok</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  {/* Sol: Action ve Tablo */}
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getActionBadge(log.action)}`}>{log.action}</div>
                    <div className="text-sm">
                      {log.action === "LOGIN" ? (
                        <span className="font-semibold text-gray-900">{log.user_name || log.user_email} sisteme giriş yaptı</span>
                      ) : (
                        <>
                          <span className="font-semibold text-gray-900">{getTableName(log.table_name)}</span>
                          {log.record_id && <span className="text-gray-500 ml-2">#{log.record_id}</span>}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sağ: Kullanıcı ve Tarih */}
                  <div className="text-right text-xs">
                    <p className="font-semibold text-gray-900">{log.user_name || log.user_email}</p>
                    <p className="text-gray-500">
                      {new Date(log.created_at).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Veri Detayları */}
                {(log.old_data || log.new_data) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <details className="cursor-pointer">
                      <summary className="text-xs font-semibold text-gray-600 hover:text-gray-900">Detayları Göster</summary>
                      <div className="mt-2 space-y-2">
                        {log.old_data && (
                          <div className="bg-red-50 rounded p-2">
                            <p className="text-xs font-semibold text-red-700 mb-1">Eski Veri:</p>
                            <pre className="text-xs text-gray-700 overflow-x-auto">{JSON.stringify(log.old_data, null, 2)}</pre>
                          </div>
                        )}
                        {log.new_data && (
                          <div className="bg-green-50 rounded p-2">
                            <p className="text-xs font-semibold text-green-700 mb-1">Yeni Veri:</p>
                            <pre className="text-xs text-gray-700 overflow-x-auto">{JSON.stringify(log.new_data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
