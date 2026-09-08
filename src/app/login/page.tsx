"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logoImg from '@/app/Tripgain Kinetic.png';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Sparkles, User, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    name: 'Arup Nirala',
    email: 'admin@tripgain.com',
    password: 'password123',
    role: 'ADMIN',
    roleLabel: 'Admin',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    avatarBg: 'bg-purple-600 text-white',
    avatarText: 'AN',
    desc: 'Full workspace & team access'
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@tripgain.com',
    password: 'password123',
    role: 'MEMBER',
    roleLabel: 'SDR Member',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    avatarBg: 'bg-blue-600 text-white',
    avatarText: 'SJ',
    desc: 'Lead outreach & inbox management'
  },
  {
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@tripgain.com',
    password: 'password123',
    role: 'MANAGER',
    roleLabel: 'Campaign Manager',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatarBg: 'bg-emerald-600 text-white',
    avatarText: 'VM',
    desc: 'Campaign strategy & team performance'
  }
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent, overrideEmail?: string, overridePassword?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const targetEmail = overrideEmail || email;
    const targetPassword = overridePassword || password;

    try {
      const res = await login(targetEmail, targetPassword);
      if (!res.success) {
        setError(res.error || 'Invalid email or password. Please try again.');
        setLoading(false);
        return;
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    handleLogin(null as any, demo.email, demo.password);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50/30 p-4 sm:p-6 lg:p-8">
      {/* Background kinetic decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-sm border border-gray-100 mb-2">
            <Image 
              src={logoImg} 
              alt="TripGain Kinetic" 
              className="h-10 w-auto object-contain max-w-[220px]" 
              priority 
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-sm text-gray-500">
            Automated multi-channel outreach & unified inbox system
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/80 p-7 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-sm flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-semibold block">Authentication failed</span>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Switcher */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick 1-Click Demo Accounts
              </span>
              <span className="text-[11px] text-gray-400">Instant test login</span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickLogin(demo)}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all flex items-center justify-between group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${demo.avatarBg}`}>
                      {demo.avatarText}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {demo.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium border ${demo.badgeColor}`}>
                          {demo.roleLabel}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 block truncate max-w-[200px]">
                        {demo.email}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <span>Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400">
          TripGain Kinetic &bull; Enterprise Multi-User Campaign Orchestration
        </p>
      </div>
    </div>
  );
}
