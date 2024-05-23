import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (email: string, token: string) => void;
  registeredEmails: string[];
  errorMessage: string;
}

export default function Login({ onLogin, registeredEmails, errorMessage }: LoginProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    const params = new URLSearchParams(window.location.search);
    const tokenFromQuery = params.get('token');
    const storedToken = tokenFromQuery || localStorage.getItem('token') || "";

    if (storedEmail && registeredEmails.includes(storedEmail)) {
      setEmail(storedEmail);
    }

    if (storedToken) {
      setPassword(storedToken);
    }
  }, [registeredEmails]);

  function handleLogin() {
    if (!registeredEmails.includes(email)) {
      setError('Email is not registered');
      return;
    }

    localStorage.setItem('email', email);
    localStorage.setItem('token', password);
    onLogin(email, password);
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Login</h2>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ margin: '0.5rem' }}
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ margin: '0.5rem' }}
        />
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
      <button onClick={handleLogin} style={{ marginTop: '1rem' }}>
        Sign In
      </button>
    </div>
  );
}
