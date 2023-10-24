import React from 'react';
import './App.css';
import Profile from './Profile';
import Shop from './Shop';


function App() {
  const path = window.location.pathname.replace(/\//g, '');
  switch (path) {
    case 'profile':
      return <Profile />;
    case 'shop':
      return <Shop />;
    default:
      return <Profile />;
  }
}

export default App;
