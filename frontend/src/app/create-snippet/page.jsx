'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Code2, ArrowLeft, Tag, Globe, Lock, FolderOpen, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css',
    'sql', 'bash', 'json', 'yaml', 'markdown', 'plaintext'
];

export default function CreateSnippetPage() {
    const router = useRouter();
    const { token, loading: authLoading } = useAuth();

    // Auth guard — redirect unauthenticated users before rendering
    useEffect(() => {
        if (!authLoading && !token) {
            router.replace('/login?redirect=/create-snippet');
        }
    }, [token, authLoading, router]);

    const [form, setForm] = useState({
        title: 'My Awesome Snippet',
        description: 'A short description of what this snippet does and when to use it.',
        code: '// Start writing your code here...',
        language: 'javascript',
        tags: 'javascript, utility',
        isPublic: true,
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleEditorChange = (value) => {
        setForm(prev => ({ ...prev, code: value || '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.title.trim()) return setError('Title is required.');
        if (!form.code.trim()) return setError('Code cannot be empty.');

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                title: form.title,
                description: form.description,
                code: form.code,
                language: form.language,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                isPublic: form.isPublic,
            };

            const res = await fetch('http://localhost:5000/api/snippet/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create snippet.');

            setSuccess(true);
            setTimeout(() => router.push('/'), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Show spinner while checking auth or redirecting
    if (authLoading || !token) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
            {/* Nav */}
            <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </button>
                    <div className="flex items-center gap-2">
                        <Code2 className="h-6 w-6 text-indigo-500" />
                        <span className="font-bold text-lg tracking-tight">SnippetHub</span>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Create a Snippet</h1>
                    <p className="mt-2 text-slate-400 text-sm">Write, describe, and share your code snippet instantly.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title & Language Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="snippet-title"
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. Debounce function in TypeScript"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Language
                            </label>
                            <select
                                id="snippet-language"
                                name="language"
                                value={form.language}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition capitalize"
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Description
                        </label>
                        <textarea
                            id="snippet-description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Brief description of what this snippet does..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none transition"
                        />
                    </div>

                    {/* Monaco Editor */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Code <span className="text-red-400">*</span>
                        </label>
                        <div className="rounded-xl overflow-hidden border border-slate-700 shadow-xl">
                            {/* Editor header bar */}
                            <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
                                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                                <span className="ml-3 text-xs text-slate-400 font-mono">{form.language}</span>
                            </div>
                            <MonacoEditor
                                height="400px"
                                language={form.language}
                                value={form.code}
                                onChange={handleEditorChange}
                                theme="vs-dark"
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on',
                                    lineNumbers: 'on',
                                    tabSize: 2,
                                    automaticLayout: true,
                                    padding: { top: 12, bottom: 12 },
                                }}
                            />
                        </div>
                    </div>

                    {/* Tags & Visibility */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                <Tag className="inline w-3.5 h-3.5 mr-1" /> Tags (comma separated)
                            </label>
                            <input
                                id="snippet-tags"
                                type="text"
                                name="tags"
                                value={form.tags}
                                onChange={handleChange}
                                placeholder="e.g. typescript, utility, hooks"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Visibility
                            </label>
                            <div className="flex gap-3 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, isPublic: true }))}
                                    className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg border text-sm font-medium transition ${form.isPublic ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                >
                                    <Globe className="w-4 h-4" /> Public
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, isPublic: false }))}
                                    className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg border text-sm font-medium transition ${!form.isPublic ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                >
                                    <Lock className="w-4 h-4" /> Private
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Snippet created! Redirecting...
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || success}
                            id="submit-snippet"
                            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                            ) : (
                                'Publish Snippet'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
