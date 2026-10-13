import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Lock, Mail, Shield, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authService.login({ email, password });
      if (res.data?.success && res.data?.data) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      } else {
        setErrorMessage(res.data?.message || 'Login failed.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
        'Unable to connect to the backend server. Please verify the API and MySQL database are active.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-navy-950">
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Login Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/75 backdrop-blur-2xl p-8 sm:p-10 shadow-glass z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 border border-cyan-400/40 mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            HostelSync ERP
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Enterprise Residential & Hostel Management
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs leading-relaxed animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@hostel.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            isPassword
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 text-sm font-semibold shadow-lg shadow-cyan-500/25"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In to Dashboard
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
            >
              Sign Up / Create Account
            </Link>
          </p>
        </div>

        {/* Demo Accounts Quick-Select */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center gap-1.5 justify-center text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Demo Credentials</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin@hostel.com')}
              className="px-2.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-300 text-xs font-medium transition-all text-center"
            >
              <Shield className="w-3.5 h-3.5 mx-auto mb-1 text-purple-400" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('warden.boys@hostel.com')}
              className="px-2.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-medium transition-all text-center"
            >
              <Building2 className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
              <span>Warden</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('alex.turner@hostel.com')}
              className="px-2.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-300 text-xs font-medium transition-all text-center"
            >
              <User className="w-3.5 h-3.5 mx-auto mb-1 text-cyan-400" />
              <span>Student</span>
            </button>
          </div>
          <p className="text-[11px] text-center text-slate-500 mt-2">
            Default password: <code className="text-slate-400 font-mono">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
};
