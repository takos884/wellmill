import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Shop from './Pages/Shop';
import Product from './Pages/Product';
import { ProductProvider } from './Contexts/ProductContext';
import Payment from './Pages/Payment';
import Delivery from './Pages/Delivery';
import ReturnPolicy from './Pages/ReturnPolicy';
import Home from './Home';
import Remote from './Pages/Remote';
import { UserProvider } from './Contexts/UserContext';
import MyPage from './Pages/MyPage';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import Contact from './Pages/Contact';
import Cart from './Pages/Cart';
import SampleRegistration from './Pages/sampleRegistration';
import Research from './Pages/research';
import ResultList from './Pages/ResultList';
import HowTo from './Pages/HowTo';
import OrderList from './Pages/OrderList';
import Addresses from './Pages/Addresses'
import Profile from './Pages/Profile';
import PostPurchase from './Pages/PostPurchase';
import Privacy from './Pages/Privacy';
import Faq from './Pages/Faq';
import PurchaseDetails from './Pages/PurchaseDetails';
import NewCustomer from './Pages/NewCustomer';
import PasswordRecover from './Pages/PasswordRecover';
import GTMHead from './Utilities/GTMHead';

function Layout() {
  const location = useLocation();

  useEffect(() => {
      window.scrollTo(0, 0);
  }, [location]);

  // Most specific at the top
  return (
    <>
      <GTMHead />
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
    </>
  )
}

function App() {
  useEffect(() => {
    (window as any).piAId = '1035241';
    (window as any).piCId = '';
    (window as any).piHostname = 'to.reprocell.co.jp';

    // Salesforce script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = (document.location.protocol === 'https:' ? 'https://' : 'http://') + 'to.reprocell.co.jp/pd.js';
    document.body.appendChild(script);
  
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  return (
    <ProductProvider>
      <UserProvider>
        <BrowserRouter basename={process.env.REACT_APP_BASENAME}>
          <Layout />
        </BrowserRouter>
      </UserProvider>
    </ProductProvider>
  );
}

export default App;