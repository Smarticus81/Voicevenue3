"use client";
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn, Building2, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const nextUrl = searchParams?.get('next') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.ok) {
        router.push(nextUrl);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="neumorphic-card p-8"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src="/bevpro-logo.svg" alt="BevPro" className="h-12" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <LogIn size={24} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your workspace</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Email Address
              </label>
              <div className="flex items-center space-x-3">
                <Mail size={20} className="text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-transparent outline-none shadow-sm text-gray-800 placeholder-gray-400"
                  placeholder="you@yourBar.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Password
              </label>
              <div className="flex items-center space-x-3">
                <Lock size={20} className="text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-transparent outline-none shadow-sm text-gray-800 placeholder-gray-400"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden py-4 px-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:from-blue-500 hover:via-cyan-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center space-x-3">
                <LogIn size={20} className="group-hover:scale-110 transition-transform duration-200" />
                <span className="text-lg">{isLoading ? 'Signing in...' : 'Sign In'}</span>
              </div>
              {!isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-cyan-400/30 to-emerald-400/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Don't have a workspace yet?{' '}
              <Link 
                href="/signup" 
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Create one now
              </Link>
            </p>
          </div>

          {/* Forgot Password */}
          <div className="mt-4 text-center">
            <Link 
              href="/forgot-password" 
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Forgot your password?
            </Link>
          </div>
        </motion.div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Having trouble? Contact{' '}
            <a href="mailto:support@bevpro.app" className="text-emerald-300 hover:text-emerald-400">
              support@bevpro.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
