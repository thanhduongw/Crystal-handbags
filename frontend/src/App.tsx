// App.tsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import Header from './components/Header';
import ProductDetail from './pages/ProductDetatil';
import Cart from './pages/Cart';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categories/:id/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
      </Routes>
    </>
  );
}
