import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Spin } from 'antd';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminCategories from './pages/Admin/AdminCategories';
import AddressManagement from './pages/AddressManagement';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';
import AdminUsers from './pages/Admin/AdminUser';
import UserLayout from './components/UserLayout';
import ProductDetail from './pages/ProductDetatil';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      {/* USER ROUTES */}
      <Route path="/" element={<UserLayout><Home /></UserLayout>} />
      <Route path="/login" element={<UserLayout><Login /></UserLayout>} />
      <Route path="/register" element={<UserLayout><Register /></UserLayout>} />
      <Route path="/about" element={<UserLayout><About /></UserLayout>} />
      <Route path="/contact" element={<UserLayout><Contact /></UserLayout>} />
      <Route path="/products" element={<UserLayout><ProductList /></UserLayout>} />
      <Route path="/products/:id" element={<UserLayout><ProductDetail /></UserLayout>} />
      <Route path="/categories/:id/products" element={<UserLayout><ProductList /></UserLayout>} />
      <Route path="/cart" element={<UserLayout><Cart /></UserLayout>} />

      {/* PROTECTED USER ROUTES */}
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <UserLayout><Checkout /></UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <UserLayout><OrderHistory /></UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <UserLayout><OrderDetail /></UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserLayout><Profile /></UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/addresses"
        element={
          <ProtectedRoute>
            <UserLayout><AddressManagement /></UserLayout>
          </ProtectedRoute>
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout><AdminDashboard /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout><AdminOrders /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout><AdminProducts /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout><AdminCategories /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout><AdminUsers /></AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <AppContent />
    </AuthProvider>
  );
}