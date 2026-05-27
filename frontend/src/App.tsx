// App.tsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { Spin } from "antd";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import ScrollToTop from "./components/ScrollToTop";
import UserLayout from "./components/UserLayout";

const Home = lazy(() => import("./pages/Home"));
const ProductList = lazy(() => import("./pages/ProductList"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/Admin/AdminOrders"));
const AdminProducts = lazy(() => import("./pages/Admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/Admin/AdminCategories"));
const AddressManagement = lazy(() => import("./pages/AddressManagement"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminUsers = lazy(() => import("./pages/Admin/AdminUser"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));

function PageFallback() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}
    >
      <Spin size="large" />
    </div>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* USER ROUTES */}
        <Route
          path="/"
          element={
            <UserLayout>
              <Home />
            </UserLayout>
          }
        />
        <Route
          path="/login"
          element={
            <UserLayout>
              <Login />
            </UserLayout>
          }
        />
        <Route
          path="/register"
          element={
            <UserLayout>
              <Register />
            </UserLayout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <UserLayout>
              <ForgotPassword />
            </UserLayout>
          }
        />
        <Route
          path="/about"
          element={
            <UserLayout>
              <About />
            </UserLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <UserLayout>
              <Contact />
            </UserLayout>
          }
        />
        <Route
          path="/products"
          element={
            <UserLayout>
              <ProductList />
            </UserLayout>
          }
        />
        <Route
          path="/products/search"
          element={
            <UserLayout>
              <ProductList />
            </UserLayout>
          }
        />
        <Route
          path="/products/:id"
          element={
            <UserLayout>
              <ProductDetail />
            </UserLayout>
          }
        />
        <Route
          path="/categories/:id/products"
          element={
            <UserLayout>
              <ProductList />
            </UserLayout>
          }
        />
        <Route
          path="/cart"
          element={
            <UserLayout>
              <Cart />
            </UserLayout>
          }
        />
        <Route path="/payment-result" element={<PaymentResult />} />
        <Route
          path="*"
          element={
            <UserLayout>
              <NotFound />
            </UserLayout>
          }
        />

        {/* PROTECTED USER ROUTES */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <UserLayout>
                <Checkout />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <UserLayout>
                <OrderHistory />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <UserLayout>
                <OrderDetail />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserLayout>
                <Profile />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/addresses"
          element={
            <ProtectedRoute>
              <UserLayout>
                <AddressManagement />
              </UserLayout>
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES - Order List */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminProducts />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminCategories />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
