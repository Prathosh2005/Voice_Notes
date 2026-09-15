import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { ArrowLeft, Share2, Send, Loader2, Music, Download, Volume2, Square, Play } from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from './api';

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(null); // 'success' | 'error' | null
  
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await api.get(`/notes/${id}`);
        setNote(res.data);
      } catch (err) {
        console.error("Failed to load note", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
    
    return () => {
      // Cleanup speech on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [id]);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareEmail) return;
    setIsSharing(true);
    setShareStatus(null);
    try {
      await api.post(`/notes/${id}/share`, { email: shareEmail });
      setShareStatus('success');
      setShareEmail('');
    } catch (err) {
      console.error("Full Error Details:", err);
      const errorMessage = err.response?.data || err.message;
      alert("Email Share Failed: " + errorMessage);
      setShareStatus('error');
    } finally {
      setIsSharing(false);
    }
  };

  const generatePDF = () => {
    if (!note) return;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.text(note.title, 20, 20);
    
    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date(note.createdAt).toLocaleString()} | Author: ${user?.email}`, 20, 30);
    
    // Summary
    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.text('AI Summary:', 20, 45);
    
    doc.setFontSize(12);
    const summaryLines = doc.splitTextToSize(note.summary || 'No summary available.', 170);
    doc.text(summaryLines, 20, 55);
    
    // Transcript
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Full Transcript:', 20, 20);
    
    doc.setFontSize(11);
    const transcriptLines = doc.splitTextToSize(note.rawTranscript || '', 170);
    doc.text(transcriptLines, 20, 30);
    
    doc.save(`${note.title.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}_VoxNote.pdf`);
  };

  const toggleSpeech = () => {
    if (!window.speechSynthesis) return alert("Text-to-Speech not supported in your browser.");
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const textToRead = note.summary || note.rawTranscript;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1115]">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f1115]">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Note not found</h2>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary-500 hover:underline">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] transition-colors duration-300 pb-12">
      <header className="bg-white/80 dark:bg-[#16171d]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{note.title}</span>
            </div>
            
            <button 
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Section */}
            <div className="bg-white dark:bg-[#16171d] rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm relative group transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-primary-500">✨</span> AI Summary
                </h2>
                <button 
                  onClick={toggleSpeech}
                  className="p-2 bg-gray-100 dark:bg-gray-800 text-primary-500 rounded-full hover:bg-primary-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
                  title="Read Aloud"
                >
                  {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                {note.summary || "No summary available."}
              </div>
            </div>

            {/* Transcript Section */}
            <div className="bg-white dark:bg-[#16171d] rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Full Transcript</h2>
              <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-serif leading-relaxed">
                {note.rawTranscript}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Details & Audio */}
            <div className="bg-white dark:bg-[#16171d] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Note Details</h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Created:</strong> {new Date(note.createdAt).toLocaleString()}</p>
                <p><strong>Author:</strong> {user?.email}</p>
              </div>
              
              {note.audioUrl && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary-500" /> Original Audio
                  </h4>
                  <audio controls className="w-full h-10 rounded-lg">
                    {/* Note: serving static files requires a backend resource handler. */}
                    <source src={`http://localhost:8080/${note.audioUrl}`} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>

            {/* Share Section */}
            <div className="bg-white dark:bg-[#16171d] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary-500" /> Share via Email
              </h3>
              <form onSubmit={handleShare} className="space-y-4">
                <div>
                  <input 
                    type="email" 
                    required 
                    placeholder="colleague@example.com" 
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSharing}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
                >
                  {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSharing ? "Sending..." : "Send Note"}
                </button>
                {shareStatus === 'success' && <p className="text-xs text-green-500 text-center font-medium">Sent successfully!</p>}
                {shareStatus === 'error' && <p className="text-xs text-red-500 text-center font-medium">Failed to send email.</p>}
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
