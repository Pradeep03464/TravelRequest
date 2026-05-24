import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import { Zap } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; 
  }

  return children;
};

const DashboardRedirect = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ROLE_EMPLOYEE') return <Navigate to="/employee" replace />;
  if (user.role === 'ROLE_MANAGER') return <Navigate to="/manager" replace />;
  if (user.role === 'ROLE_ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(99,102,241,0.25)',
              padding: '20px 32px',
              fontSize: '14px',
              fontWeight: '800',
              border: '1px solid #f1f5f9'
            }
          }} 
        />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<DashboardRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/employee/*" element={
                  <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_MANAGER', 'ROLE_ADMIN']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/manager/*" element={
                  <ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_ADMIN']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/admin/*" element={
                  <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />

                <Route path="/reports" element={
                  <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER']}>
                    <Reports />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </main>
          
          <footer className="py-20 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 mt-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
            
            <div className="container mx-auto px-8 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-16">
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="flex items-center gap-3 group">
                    <div className="p-3 mmt-gradient rounded-[1.2rem] shadow-2xl shadow-indigo-500/40 group-hover:shadow-indigo-500/60 transition-all">
                      <Zap className="h-6 w-6 text-white fill-white" />
                    </div>
                    <span className="text-3xl font-black tracking-tighter bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                        Travel<span className="text-indigo-400">Request</span>
                    </span>
                  </div>
                  <p className="text-indigo-200/70 font-bold text-xs uppercase tracking-widest leading-relaxed">Redefining Enterprise Mobility</p>
                </div>
                
                <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6 text-[11px] font-black uppercase tracking-[0.25em] text-indigo-300/80">
                  <a href="#" className="hover:text-indigo-300 transition-all duration-300 hover:scale-110">Digital Terms</a>
                  <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                  <a href="#" className="hover:text-indigo-300 transition-all duration-300 hover:scale-110">Privacy Node</a>
                  <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                  <a href="#" className="hover:text-indigo-300 transition-all duration-300 hover:scale-110">Hub Center</a>
                </div>

                <div className="text-center md:text-right space-y-2">
                    <p className="text-2xl font-black tracking-tighter bg-gradient-to-r from-indigo-300 to-white bg-clip-text text-transparent mb-2">&copy; {new Date().getFullYear()}</p>
                    <p className="text-indigo-300/60 text-[10px] font-black uppercase tracking-widest">Enterprise Group Node</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
