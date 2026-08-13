'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Code2, Copy, Terminal, Sparkles, Check, LogOut, UserCircle2, Plus, Share2, Eye, ThumbsUp, Calendar } from 'lucide-react';
import { useAuth } from './context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Snippets search & filter state
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [sharedId, setSharedId] = useState(null);

  // Debouncing search query
  const searchTimeoutRef = useRef(null);

  const fetchSnippets = async (query = '', lang = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (lang) params.append('language', lang);
      
      const res = await fetch(`http://localhost:5000/api/snippet/getall?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch snippets');
      const data = await res.json();
      setSnippets(data.snippets || []);
    } catch (err) {
      console.error(err);
      setError('Could not load snippets from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSnippets(search, language);
  }, [language]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchSnippets(val, language);
    }, 500);
  };

  const handleCopy = (id, code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (id, shareToken, e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setSharedId(id);
    setTimeout(() => setSharedId(null), 2000);
  };

  const handleCreateSnippet = () => {
    if (user) {
      router.push('/create-snippet');
    } else {
      router.push('/login?redirect=/create-snippet');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const languages = ['All', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'HTML', 'CSS', 'SQL', 'Markdown'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
            <Code2 className="h-8 w-8 text-indigo-500" />
            <span className="font-bold text-xl tracking-tight">SnippetHub</span>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              /* ── Logged-in state ── */
              <>
                <button
                  id="create-snippet-btn"
                  onClick={handleCreateSnippet}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Create Snippet
                </button>

                {/* User avatar / name */}
                <div className="flex items-center gap-2 pl-1 border-l border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                    <UserCircle2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-sm text-slate-300 font-medium hidden sm:block max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <button
                    id="logout-btn"
                    onClick={handleLogout}
                    title="Logout"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* ── Logged-out state ── */
              <>
                <button
                  id="login-nav-btn"
                  onClick={() => router.push('/login')}
                  className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition"
                >
                  Sign In
                </button>
                <button
                  id="signup-nav-btn"
                  onClick={() => router.push('/signup')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-500/20"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Instant Code Sharing
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Share code snippets <br /> in seconds, not minutes.
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-8">
          An effortless platform for developers to store, discover, and share reusable code fragments with syntax highlighting and instant embedding.
        </p>

        {/* Hero CTA */}
        {!user && (
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={() => router.push('/signup')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/20"
            >
              Start for free
            </button>
            <button
              onClick={() => router.push('/login')}
              className="text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-6 py-3 rounded-xl text-sm font-medium transition"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative mb-8">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search snippets by language, title, or tag..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-inner"
          />
        </div>

        {/* Language Filter Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto mb-4">
          {languages.map((lang) => {
            const isSelected = (lang === 'All' && !language) || (language.toLowerCase() === lang.toLowerCase());
            return (
              <button
                key={lang}
                onClick={() => setLanguage(lang === 'All' ? '' : lang.toLowerCase())}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Snippets Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Terminal className="text-indigo-400" /> Discover Snippets
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">{error}</div>
        ) : snippets.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800 text-slate-400">
            No snippets found match your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {snippets.map((snippet) => (
              <div 
                key={snippet._id} 
                onClick={() => router.push(`/snippet/${snippet._id}`)}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl hover:border-slate-700 hover:shadow-2xl transition cursor-pointer flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/80">
                  <div className="max-w-[70%]">
                    <h3 className="font-semibold text-slate-200 truncate">{snippet.title}</h3>
                    <p className="text-xs text-slate-500 truncate">
                      by @{snippet.author?.name || 'anonymous'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono capitalize">
                      {snippet.language}
                    </span>
                    <button
                      onClick={(e) => handleCopy(snippet._id, snippet.code, e)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition"
                      title="Copy Code"
                    >
                      {copiedId === snippet._id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => handleShare(snippet._id, snippet.shareToken, e)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition"
                      title="Copy Share Link"
                    >
                      {sharedId === snippet._id ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Code Preview Block */}
                <div className="p-4 bg-slate-950/60 font-mono text-sm overflow-x-auto text-slate-300 line-clamp-6 min-h-[120px] max-h-[220px]">
                  <pre className="pointer-events-none"><code>{snippet.code}</code></pre>
                </div>

                {/* Card Footer info */}
                <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {snippet.views}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {snippet.likes?.length || 0}</span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> 
                    {new Date(snippet.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unauthenticated CTA at bottom */}
        {!user && (
          <div className="mt-12 text-center bg-slate-900/50 border border-slate-700/50 rounded-2xl p-10">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
              <Code2 className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ready to share your code?</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Create a free account to publish, organize, and share your own code snippets with the world.
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/20"
            >
              Create your free account
            </button>
          </div>
        )}
      </section>
    </div>
  );
}