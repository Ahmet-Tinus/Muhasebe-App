import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Raporlar from "./pages/Raporlar";
import AuditLogs from "./pages/AuditLogs";
import UserManagement from './pages/UserManagement';

function AppContent() {
  const { isAuthenticated, isLoading, logout, user, isAdmin, isSuperAdmin } = useAuth();
  const [activePage, setActivePage] = useState<'dashboard' | 'raporlar' | 'logs' | 'users'>('dashboard'); // ← 'users' EKLE

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-4 sm:space-x-12 overflow-x-auto">
              {/* Logo */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg sm:text-xl font-bold">₺</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">Muhasebe Pro</span>
              </div>

              {/* Nav Links */}
              <div className="flex space-x-1 sm:space-x-2">
                <button
                  onClick={() => setActivePage("dashboard")}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
                    activePage === "dashboard" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActivePage("raporlar")}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
                    activePage === "raporlar" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Raporlar
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setActivePage("logs")}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
                      activePage === "logs" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    Loglar
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    onClick={() => setActivePage('users')}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
                      activePage === 'users'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Kullanıcılar
                  </button>
                )}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role === "admin" ? "👑 Admin" : "👁️ Viewer"}</p>
              </div>
              <button onClick={logout} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all text-sm">
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'raporlar' && <Raporlar />}
      {activePage === 'logs' && isAdmin && <AuditLogs />}
      {activePage === 'users' && isSuperAdmin && <UserManagement />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;