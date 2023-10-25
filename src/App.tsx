import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Profile from './Profile';
import Shop from './Shop';
import Product from './Product';
import { ProductProvider } from './ProductContext';

function App() {
  return (
    <ProductProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/shop/:productId" element={<Product />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </ProductProvider>
  );
}

export default App;

// <Route path="/" element={<Home />} />