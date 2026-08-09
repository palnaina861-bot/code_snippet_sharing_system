'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Code2, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SignupSchema = Yup.object().shape({
    name: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name is too long')
        .required('Full name is required'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .required('Password is required')
        .matches(/[a-z]/, 'Must contain a lowercase letter')
        .matches(/[A-Z]/, 'Must contain an uppercase letter')
        .matches(/[0-9]/, 'Must contain a number')
        .matches(/[@#$%&]/, 'Must contain a special character (@#$%&)')
        .min(8, 'Must be at least 8 characters'),
    confirmPassword: Yup.string()
        .required('Please confirm your password')
        .oneOf([Yup.ref('password')], 'Passwords do not match'),
});

export default function SignupPage() {
    const router = useRouter();
    const { login, user } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    // If already logged in, redirect away
    useEffect(() => {
        if (user) router.replace('/');
    }, [user, router]);

    const formik = useFormik({
        initialValues: { name: '', email: '', password: '', confirmPassword: '' },
        validationSchema: SignupSchema,
        onSubmit: async (values) => {
            setApiError('');
            setLoading(true);
            try {
                const res = await fetch('http://localhost:5000/api/user/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: values.name,
                        email: values.email,
                        password: values.password,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Signup failed.');
                login(data);
                router.push('/');
            } catch (err) {
                setApiError(err.message);
            } finally {
                setLoading(false);
            }
        },
    });

    // Helper to show field error only when touched
    const fieldError = (field) =>
        formik.touched[field] && formik.errors[field] ? formik.errors[field] : null;

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
                    <h1 className="mt-6 text-3xl font-extrabold text-white">Create your account</h1>
                    <p className="mt-2 text-sm text-slate-400">Start sharing code snippets in seconds</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl shadow-black/40">
                    <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>

                        {/* Full Name */}
                        <div>
                            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder="Jane Doe"
                                    className={`w-full bg-slate-800/70 border rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${fieldError('name') ? 'border-red-500/60' : 'border-slate-700'}`}
                                />
                            </div>
                            {fieldError('name') && (
                                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />{fieldError('name')}
                                </p>
                            )}
                        </div>

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
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder="you@example.com"
                                    className={`w-full bg-slate-800/70 border rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${fieldError('email') ? 'border-red-500/60' : 'border-slate-700'}`}
                                />
                            </div>
                            {fieldError('email') && (
                                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />{fieldError('email')}
                                </p>
                            )}
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
                                    autoComplete="new-password"
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder="••••••••"
                                    className={`w-full bg-slate-800/70 border rounded-xl pl-10 pr-12 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${fieldError('password') ? 'border-red-500/60' : 'border-slate-700'}`}
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
                            {fieldError('password') && (
                                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />{fieldError('password')}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={formik.values.confirmPassword}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder="••••••••"
                                    className={`w-full bg-slate-800/70 border rounded-xl pl-10 pr-12 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${fieldError('confirmPassword') ? 'border-red-500/60' : 'border-slate-700'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {fieldError('confirmPassword') && (
                                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />{fieldError('confirmPassword')}
                                </p>
                            )}
                            {formik.values.confirmPassword && !fieldError('confirmPassword') && (
                                <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                                </p>
                            )}
                        </div>

                        {/* API Error */}
                        {apiError && (
                            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {apiError}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            id="signup-submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-500/20 mt-2"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-700" />
                        <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-slate-700" />
                    </div>

                    {/* Login link */}
                    <p className="text-center text-sm text-slate-400">
                        Already have an account?{' '}
                        <button
                            onClick={() => router.push('/login')}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
                        >
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}