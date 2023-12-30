import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Shop from './Shop';
import Product from './Product';
import { ProductProvider } from './ProductContext';
import Payment from './Payment';
import Delivery from './Delivery';
import ReturnPolicy from './ReturnPolicy';
import Home from './Home';
import Remote from './Remote';
import { UserProvider } from './Hooks/UserContext';
import MyPage from './MyPage';
import Login from './Login';
import Signup from './Signup';
import Contact from './Contact';
import Cart from './Cart';
import SampleRegistration from './sampleRegistration';
import Research from './research';
import ResultList from './ResultList';
import HowTo from './HowTo';
import OrderList from './OrderList';
import Addresses from './Addresses'
import Profile from './Profile';
import PostPurchase from './PostPurchase';
import Privacy from './Privacy';
import Faq from './Faq';
import PurchaseDetails from './PurchaseDetails';
import NewCustomer from './NewCustomer';
import PasswordRecover from './PasswordRecover';

function Layout() {
  const location = useLocation();

  useEffect(() => {
      window.scrollTo(0, 0);
  }, [location]);

  // Most specific at the top
  return (
    <Routes>
      <Route path="/remote-examination" element={<Remote />} />
      <Route path="/shop/:productId" element={<Product />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/post-purchase" element={<PostPurchase />} />
      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<Signup />} />
      <Route path="/new-customer" element={<NewCustomer />} />
      <Route path="/password-recover" element={<PasswordRecover />} />

      <Route path="/account" element={<MyPage />} />
      <Route path="/sample-registration" element={<SampleRegistration />} />
      <Route path="/research" element={<Research />} />
      <Route path="/result-list" element={<ResultList />} />
      <Route path="/how_to" element={<HowTo />} />
      <Route path="/order-list" element={<OrderList />} />
      <Route path="/purchaseDetails/:purchaseKey" element={<PurchaseDetails />} />
      <Route path="/address" element={<Addresses />} />
      <Route path="/profile" element={<Profile />} />

      <Route path="/payment" element={<Payment />} />
      <Route path="/delivery" element={<Delivery />} />
      <Route path="/return-policy" element={<ReturnPolicy />} />
      <Route path="/privacy-policy" element={<Privacy />} />
      <Route path="/qa" element={<Faq />} />
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

function App() {
  return (
    <ProductProvider>
      <UserProvider>
        <BrowserRouter basename="/wellmill">
          <Layout />
        </BrowserRouter>
      </UserProvider>
    </ProductProvider>
  );
}

export default App;