import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Profile from './Profile';
import Shop from './Shop';
import Product from './Product';
import { ProductProvider } from './ProductContext';
import Payment from './Payment';

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
      <Route path="/payment" element={<Payment />} />
    </Routes>
  )
}

function App() {
  return (
    <ProductProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ProductProvider>
  );
}

export default App;

// <Route path="/" element={<Home />} />