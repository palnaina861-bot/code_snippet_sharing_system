'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Code2, Copy, Share2, Eye, ThumbsUp, Calendar, Tag, Check, Globe, Lock, Loader2, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Dynamically import Monaco Editor to avoid SSR errors
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function PublicSharePage() {
  const { token: shareToken } = useParams();
  const router = useRouter();
  const { token: userToken, user } = useAuth();

  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Like states
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    const fetchSnippet = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/snippet/share/${shareToken}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Snippet not found');
        setSnippet(data.snippet);
        setLikeCount(data.snippet.likes?.length || 0);

        // Determine if user has already liked this
        if (user && data.snippet.likes) {
          setIsLiked(data.snippet.likes.includes(user._id));
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Could not retrieve shared snippet.');
      } finally {
        setLoading(false);
      }
    };
    fetchSnippet();
  }, [shareToken, user]);

  const handleCopy = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!snippet) return;
    const shareUrl = `${window.location.origin}/share/${snippet.shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleLike = async () => {
    if (!user) {
      // Redirect to login, but redirect back to this share page afterwards
      router.push(`/login?redirect=/share/${shareToken}`);
      return;
    }
    if (likeLoading || !snippet) return;

    setLikeLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/snippet/like/${snippet._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setLikeCount(data.likes);
      setIsLiked(data.liked);
    } catch (err) {
      console.error('Error liking snippet:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-400">Error</h2>
          <p className="text-slate-400">{error || 'Shared snippet could not be found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Navbar header */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <Code2 className="h-6 w-6 text-indigo-500" />
            <span className="font-bold text-lg tracking-tight">SnippetHub</span>
          </div>
        </div>
      </nav>

      {/* Main Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Banner highlighting that this is a shared link */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-4 py-2.5 rounded-lg mb-6 flex items-center justify-between">
          <span>You are viewing a shared snippet link. Anyone with this link can view this content.</span>
          <button 
            onClick={() => router.push('/signup')}
            className="text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded transition"
          >
            Join SnippetHub
          </button>
        </div>

        {/* Title / Description info */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-md font-mono font-semibold capitalize">
                {snippet.language}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                {snippet.isPublic ? (
                  <><Globe className="w-3.5 h-3.5" /> Public</>
                ) : (
                  <><Lock className="w-3.5 h-3.5 text-yellow-500" /> Private (Shared)</>
                )}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{snippet.title}</h1>
            {snippet.description && (
              <p className="text-slate-400 max-w-3xl text-sm leading-relaxed">{snippet.description}</p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                isLiked
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{likeCount}</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-500/20"
            >
              {shared ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              <span>{shared ? 'Link Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Code Monaco view */}
        <div className="rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl mb-8">
          <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              <span className="ml-3 text-xs text-slate-400 font-mono capitalize">{snippet.language}</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">Read Only</span>
          </div>
          <MonacoEditor
            height="450px"
            language={snippet.language}
            value={snippet.code}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              readOnly: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>

        {/* Footer Meta / Tags */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/40 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
              <UserCircle2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Published by</p>
              <p className="text-sm font-semibold text-slate-200">@{snippet.author?.name || 'anonymous'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Created on</p>
              <p className="text-sm font-semibold text-slate-200">
                {new Date(snippet.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <Eye className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Views</p>
              <p className="text-sm font-semibold text-slate-200">{snippet.views}</p>
            </div>
          </div>

          {snippet.tags?.length > 0 && (
            <div className="md:col-span-3 border-t border-slate-800/80 pt-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
                <Tag className="w-3.5 h-3.5" /> Tags:
              </span>
              {snippet.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs px-2.5 py-1 rounded-md font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
