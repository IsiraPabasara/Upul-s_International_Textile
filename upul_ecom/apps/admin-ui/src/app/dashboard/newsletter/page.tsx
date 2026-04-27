"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import axiosInstance from '@/app/utils/axiosInstance';
import toast from 'react-hot-toast';
import { 
  Search, Users, CheckCircle, XCircle, Send, 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  Heading1, Heading2, List, ListOrdered, Quote, Minus, 
  Undo, Redo 
} from 'lucide-react';

// --- 1. TIPTAP RICH TEXT EDITOR COMPONENT ---
const RichTextEditor = ({ content, onChange }: { content: string, onChange: (html: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Underline,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100',
      },
    },
  });

  if (!editor) return null;

  const activeClass = "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
  const defaultClass = "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800";

  return (
    <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col focus-within:ring-4 focus-within:ring-gray-100 dark:focus-within:ring-slate-800 transition-all bg-white dark:bg-slate-900 shadow-sm">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/50 backdrop-blur-sm items-center">
        
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={`p-2 rounded-xl transition-colors disabled:opacity-30 ${defaultClass}`} title="Undo">
          <Undo size={16} />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={`p-2 rounded-xl transition-colors disabled:opacity-30 mr-1 ${defaultClass}`} title="Redo">
          <Redo size={16} />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1"></div> 

        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('bold') ? activeClass : defaultClass}`} title="Bold">
          <Bold size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('italic') ? activeClass : defaultClass}`} title="Italic">
          <Italic size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('underline') ? activeClass : defaultClass}`} title="Underline">
          <UnderlineIcon size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('strike') ? activeClass : defaultClass}`} title="Strikethrough">
          <Strikethrough size={16} />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1"></div> 

        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('heading', { level: 1 }) ? activeClass : defaultClass}`} title="Heading 1">
          <Heading1 size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('heading', { level: 2 }) ? activeClass : defaultClass}`} title="Heading 2">
          <Heading2 size={16} />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1"></div> 

        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('bulletList') ? activeClass : defaultClass}`} title="Bullet List">
          <List size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('orderedList') ? activeClass : defaultClass}`} title="Numbered List">
          <ListOrdered size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('blockquote') ? activeClass : defaultClass}`} title="Quote">
          <Quote size={16} />
        </button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={`p-2 rounded-xl transition-colors ${defaultClass}`} title="Horizontal Line">
          <Minus size={16} />
        </button>
      </div>

      <EditorContent editor={editor} className="bg-white dark:bg-slate-900" />
    </div>
  );
};

// --- 2. MAIN ADMIN PAGE COMPONENT ---
export default function AdminNewsletterPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'list' | 'compose'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Compose State
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('<h2>Hello Fashion Lovers,</h2><p>Check out our latest arrivals...</p>');
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual'); 

  // Fetch Subscribers
  const { data, isLoading } = useQuery({
    queryKey: ['adminSubscribers', searchTerm],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/admin/email/newsletter/subscribers?search=${searchTerm}`);
      return res.data;
    }
  });

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => axiosInstance.put(`/api/admin/email/newsletter/subscribers/${id}/toggle`),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['adminSubscribers'] });
    },
    onError: () => toast.error("Failed to update status")
  });

  // Broadcast Mutation
  const broadcastMutation = useMutation({
    mutationFn: async () => axiosInstance.post(`/api/admin/email/newsletter/broadcast`, { subject, htmlContent }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setSubject('');
      setHtmlContent('');
      setActiveTab('list');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Broadcast failed")
  });

  const stats = data?.stats || { total: 0, activeCount: 0 };

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 pb-32 font-sans transition-colors duration-300">
      
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Stats */}
        <div className="space-y-6 pt-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Newsletter Management
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Manage your subscribers and send broadcast campaigns.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                <Users size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">Total Subscribers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stats.total}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">Active (Receiving)</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">{stats.activeCount}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-800/30">
                <XCircle size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">Unsubscribed</p>
                <p className="text-3xl font-bold text-rose-700 dark:text-rose-400 tracking-tight">{stats.total - stats.activeCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('list')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'list' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Subscriber List
          </button>
          <button 
            onClick={() => setActiveTab('compose')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'compose' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Compose Broadcast
          </button>
        </div>

        {/* TAB 1: List */}
        {activeTab === 'list' && (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-full max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search emails..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-slate-800 focus:border-gray-300 dark:focus:border-slate-700 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 dark:bg-slate-950/80 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-100 dark:border-slate-800 backdrop-blur-sm">
                  <tr>
                    <th className="p-5 pl-6">Email</th>
                    <th className="p-5">Account Type</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Joined</th>
                    <th className="p-5 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-500 dark:text-slate-400">Loading subscribers...</td></tr>
                  ) : data?.data?.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="p-5 pl-6 font-medium text-gray-900 dark:text-gray-100">{sub.email}</td>
                      <td className="p-5">
                        {sub.user ? (
                          <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-100 dark:border-blue-800/30">
                            Registered User
                          </span>
                        ) : (
                          <span className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-200 dark:border-slate-700">
                            Guest
                          </span>
                        )}
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          sub.isActive 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30' 
                            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30'
                        }`}>
                          {sub.isActive ? 'Active' : 'Unsubscribed'}
                        </span>
                      </td>
                      <td className="p-5 text-gray-500 dark:text-slate-400">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-5 text-right pr-6">
                        <button 
                          onClick={() => toggleMutation.mutate(sub.id)}
                          disabled={toggleMutation.isPending}
                          className={`text-xs font-bold transition-colors disabled:opacity-50 ${
                            sub.isActive 
                              ? 'text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300' 
                              : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300'
                          }`}
                        >
                          {sub.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Compose Broadcast */}
        {activeTab === 'compose' && (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[24px] p-6 sm:p-8 max-w-4xl shadow-sm">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Campaign</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                This email will be sent to <strong className="text-emerald-600 dark:text-emerald-400">{stats.activeCount} active subscribers</strong>. (Unsubscribe links are added automatically).
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject Line</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Massive Weekend Sale! 50% Off Everything" 
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-slate-800 focus:border-gray-300 dark:focus:border-slate-700 transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-end mb-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Email Content</label>
                  
                  {/* Mode Toggle */}
                  <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                    <button 
                      onClick={() => setEditorMode('visual')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${editorMode === 'visual' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                      Visual Editor
                    </button>
                    <button 
                      onClick={() => setEditorMode('html')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${editorMode === 'html' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                      Raw HTML
                    </button>
                  </div>
                </div>
                
                {editorMode === 'visual' ? (
                  <RichTextEditor 
                    content={htmlContent} 
                    onChange={setHtmlContent} 
                  />
                ) : (
                  <div className="relative">
                    <textarea 
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      rows={15}
                      className="w-full p-5 bg-slate-950 text-emerald-400 font-mono text-sm border border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-slate-800 transition-all shadow-inner leading-relaxed resize-y"
                      placeholder=""
                    />
                    <div className="absolute top-3 right-5 px-2 py-1 bg-slate-800/80 rounded text-[10px] uppercase font-bold tracking-wider text-slate-400 pointer-events-none backdrop-blur-sm">
                      HTML Mode
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  if(confirm(`Are you sure you want to send this to ${stats.activeCount} people?`)) {
                    broadcastMutation.mutate();
                  }
                }}
                disabled={broadcastMutation.isPending || stats.activeCount === 0 || !subject}
                className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-2xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                {broadcastMutation.isPending ? (
                   <span className="flex items-center gap-2">Queuing Emails...</span>
                ) : (
                  <><Send size={18} /> Send to {stats.activeCount} Subscribers</>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}