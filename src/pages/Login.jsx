import React, { useState } from 'react';
import { api } from '../services/api';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const enteredEmail = email.trim().toLowerCase();
    const enteredPassword = password.trim();

    // Try live API for credentials
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        onLoginSuccess();
      } else {
        setError(response.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 animate-fade-in">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-600/10 to-transparent pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-100 p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-emerald-900/5 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Portal</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Sign in to access the command center</p>
        </div>

        {/* Credentials Hint - Click to Auto-Fill */}
        <button
          type="button"
          onClick={() => { setEmail('admin@gmail.com'); setPassword('admin123'); }}
          className="w-full mb-5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl p-3 text-center transition-all cursor-pointer group"
        >
          <p className="text-xs font-black text-emerald-700 group-hover:text-emerald-900">⚡ Click here to Auto-Fill Credentials</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">admin@gmail.com · admin123</p>
        </button>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                placeholder="admin@gmail.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                maxLength={50}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4 cursor-pointer ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Secure connection &bull; Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
