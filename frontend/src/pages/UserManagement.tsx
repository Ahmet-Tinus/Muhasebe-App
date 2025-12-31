import { useEffect, useState } from "react";
import { getAllUsers, createUser, deleteUser, updateUser } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "viewer";
  is_super_admin?: boolean;
  created_at: string;
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "viewer">("viewer");
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!email || !password || !name) {
      setFormError("Tüm alanları doldurun");
      return;
    }

    if (password.length < 6) {
      setFormError("Şifre en az 6 karakter olmalı");
      return;
    }

    try {
      await createUser({ email, password, name, role });

      // Formu temizle
      setEmail("");
      setPassword("");
      setName("");
      setRole("viewer");
      setShowModal(false);

      // Listeyi yenile
      loadUsers();
    } catch (error: any) {
      setFormError(error.response?.data?.error || "Kullanıcı oluşturulamadı");
    }
  };
const handleEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword(''); // Şifre boş bırakılabilir
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name || !email) {
      setFormError('İsim ve email gerekli');
      return;
    }

    if (password && password.length < 6) {
      setFormError('Şifre en az 6 karakter olmalı');
      return;
    }

    try {
      const updateData: any = { name, email, role };
      if (password) {
        updateData.password = password;
      }

      await updateUser(editingUser!.id, updateData);
      
      // Formu temizle
      setName('');
      setEmail('');
      setPassword('');
      setRole('viewer');
      setShowEditModal(false);
      setEditingUser(null);
      
      // Listeyi yenile
      loadUsers();
    } catch (error: any) {
      setFormError(error.response?.data?.error || 'Kullanıcı güncellenemedi');
    }
  };
  const handleDelete = async (userId: number, userName: string) => {
    if (!confirm(`"${userName}" kullanıcısını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteUser(userId);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || "Kullanıcı silinemedi");
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
      <div className="max-w-6xl mx-auto">
        {/* Başlık */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
                <p className="text-gray-500 mt-1">{users.length} kullanıcı</p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Yeni Kullanıcı
            </button>
          </div>
        </div>

        {/* Kullanıcı Tablosu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kayıt Tarihi</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-bold">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                          {user.is_super_admin && <div className="text-xs text-indigo-600 font-semibold">👑 Süper Admin</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${user.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                        {user.role === "admin" ? "🔑 Admin" : "👁️ Viewer"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString("tr-TR")}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Düzenle
                        </button>
                        {!user.is_super_admin && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Sil
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Yeni Kullanıcı Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Yeni Kullanıcı Ekle</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormError("");
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{formError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ahmet Yılmaz"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="ahmet@muhasebe.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="En az 6 karakter"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      role === "admin" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input type="radio" value="admin" checked={role === "admin"} onChange={(e) => setRole(e.target.value as "admin")} className="sr-only" />
                    <span className={`font-medium ${role === "admin" ? "text-blue-700" : "text-gray-600"}`}>🔑 Admin</span>
                  </label>
                  <label
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      role === "viewer" ? "border-gray-500 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input type="radio" value="viewer" checked={role === "viewer"} onChange={(e) => setRole(e.target.value as "viewer")} className="sr-only" />
                    <span className={`font-medium ${role === "viewer" ? "text-gray-700" : "text-gray-600"}`}>👁️ Viewer</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all"
              >
                Kullanıcı Oluştur
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Kullanıcı Düzenle Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Kullanıcı Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setFormError('');
                  setPassword('');
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre <span className="text-gray-400">(Opsiyonel)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Değiştirmek istemiyorsanız boş bırakın"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {!editingUser.is_super_admin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rol
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      role === 'admin' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="admin"
                        checked={role === 'admin'}
                        onChange={(e) => setRole(e.target.value as 'admin')}
                        className="sr-only"
                      />
                      <span className={`font-medium ${role === 'admin' ? 'text-blue-700' : 'text-gray-600'}`}>
                        🔑 Admin
                      </span>
                    </label>
                    <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      role === 'viewer' 
                        ? 'border-gray-500 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="viewer"
                        checked={role === 'viewer'}
                        onChange={(e) => setRole(e.target.value as 'viewer')}
                        className="sr-only"
                      />
                      <span className={`font-medium ${role === 'viewer' ? 'text-gray-700' : 'text-gray-600'}`}>
                        👁️ Viewer
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Güncelle
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
