import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Profile from './Profile';
import Shop from './Shop';
import Product from './Product';
import { ProductProvider } from './ProductContext';
import Payment from './Payment';
import Delivery from './Delivery';
import ReturnPolicy from './ReturnPolicy';
import Home from './Home';
import Remote from './Remote';
import { UserProvider } from './useUserData';
import MyPage from './MyPage';
import Login from './Login';
import Signup from './Signup';

function Layout() {
  const location = useLocation();

  useEffect(() => {
      window.scrollTo(0, 0);
  }, [location]);

  return (
    <Routes>
      <Route path="/shop/:productId" element={<Product />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/delivery" element={<Delivery />} />
      <Route path="/return-policy" element={<ReturnPolicy />} />
      <Route path="/remote" element={<Remote />} />
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

function App() {
  return (
    <ProductProvider>
      <UserProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </UserProvider>
    </ProductProvider>
  );
}

export default App;