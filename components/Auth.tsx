import React, { useState } from 'react';
import { supabase, isOfflineMode } from '../services/supabaseClient';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isOfflineMode) {
        // Mock login for demo
        setTimeout(() => {
            onLogin({ id: 'mock-user', email });
            setLoading(false);
        }, 800);
        return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        alert('Check your email for the magic link!');
      } else {
        // Simple mock sign up flow logic for this example
        // In a real app, use signUp() with password or OTP
        const { data, error } = await supabase.auth.signInWithOtp({ email }); 
        if (error) throw error;
        alert('Check your email to finish registration!');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
            <h1 className="text-4xl font-extrabold text-brand-600 mb-2">TripFlow</h1>
            <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
                {isOfflineMode && <span className="flex items-center justify-center gap-1 text-amber-600"><AlertCircle size={14}/> Demo Mode (No DB Connected)</span>}
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            {!isOfflineMode && (
                 <div className="relative">
                 <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                 <input
                 type="password"
                 className="appearance-none rounded-lg relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                 placeholder="Password (Optional for Magic Link)"
                 />
             </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </div>
        </form>
        <div className="text-center">
            <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium text-brand-600 hover:text-brand-500"
            >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
        </div>
      </div>
    </div>
  );
};
