import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [userName, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      localStorage.setItem('userEmail', email);
      setName(user.user.name);
      localStorage.setItem('userName', user.user.name);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h2 className="auth-title">Sign In</h2>
        <p className="auth-subtitle">Welcome back! Please login to your account.</p>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="auth-input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="auth-input"
            required
          />
          <button type="submit" className="auth-btn">Login</button>
        </form>
        <p className="auth-register">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
      <style>{`
        .auth-bg {
          min-height: 100vh;
          background: linear-gradient(120deg, #0d1b3d 0%, #112b57 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Raleway', sans-serif;
        }
        .auth-card {
          background: rgba(17, 43, 87, 0.75);
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          padding: 2.5rem 2rem;
          width: 350px;
          text-align: center;
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          animation: fadeIn 1.2s;
        }
        .auth-title {
          font-size: 2rem;
          font-weight: 700;
          color: #e0e0ff;
          margin-bottom: 0.5rem;
        }
        .auth-subtitle {
          color: #bbb;
          margin-bottom: 1.5rem;
        }
        .auth-error {
          color: #ff6b6b;
          margin-bottom: 1rem;
          font-weight: 500;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .auth-input {
          padding: 0.75rem 1rem;
          border: 1px solid #3a4a7d;
          border-radius: 8px;
          font-size: 1rem;
          background: rgba(255,255,255,0.1);
          color: #e0e0ff;
          transition: border 0.3s, background 0.3s;
        }
        .auth-input:focus {
          border-color: #4ecca3;
          outline: none;
          background: rgba(255,255,255,0.15);
        }
        .auth-btn {
          background: linear-gradient(90deg, #112b57 0%, #0d1b3d 100%);
          color: #e0e0ff;
          border: none;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transition: all 0.3s ease;
        }
        .auth-btn:hover {
          background: linear-gradient(90deg, #0d1b3d 0%, #112b57 100%);
          transform: translateY(-2px);
        }
        .auth-register {
          margin-top: 1.5rem;
          color: #bbb;
        }
        .auth-register a {
          color: #4ecca3;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.3s;
        }
        .auth-register a:hover {
          color: #3ec6e0;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}
