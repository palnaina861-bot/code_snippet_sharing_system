'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Code2, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, user } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If already logged in, redirect away
    useEffect(() => {
        if (user) {
            const redirect = searchParams.get('redirect') || '/';
            router.replace(redirect);
        }
    }, [user, router, searchParams]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            return setError('Email and password are required.');
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, password: form.password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed.');
            login(data);
            const redirect = searchParams.get('redirect') || '/';
            router.push(redirect);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="inline-flex items-center gap-2 group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:bg-indigo-500 transition">
                            <Code2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">SnippetHub</span>
                    </button>
                    <h1 className="mt-6 text-3xl font-extrabold text-white">Welcome back</h1>
                    <p className="mt-2 text-sm text-slate-400">Sign in to create and share your snippets</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl shadow-black/40">
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-10 pr-12 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Banner */}
                        {error && (
                            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            id="login-submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-500/20 mt-2"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-700" />
                        <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-slate-700" />
                    </div>

                    {/* Sign up link */}
                    <p className="text-center text-sm text-slate-400">
                        Don&apos;t have an account?{' '}
                        <button
                            onClick={() => router.push('/signup')}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
                        >
                            Create one for free
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
