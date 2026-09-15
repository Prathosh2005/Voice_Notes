import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { ThemeContext } from './ThemeContext';
import { ArrowLeft, Clock, Calendar, FileText, Moon, Sun } from 'lucide-react';
import api from './api';
import { ParticleCard, GlobalSpotlight } from './components/MagicBento';

export default function History() {
  const { user } = useContext(AuthContext);
  const gridRef = useRef(null);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [groupedNotes, setGroupedNotes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get('/notes');
        const fetchedNotes = res.data;
        setNotes(fetchedNotes);
        setGroupedNotes(groupNotesByDate(fetchedNotes));
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const groupNotesByDate = (notesArray) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups = {
      'Today': [],
      'Yesterday': [],
      'Last 7 Days': [],
      'Older': []
    };

    notesArray.forEach(note => {
      const noteDate = new Date(note.createdAt);
      
      if (noteDate.toDateString() === today.toDateString()) {
        groups['Today'].push(note);
      } else if (noteDate.toDateString() === yesterday.toDateString()) {
        groups['Yesterday'].push(note);
      } else {
        const diffTime = Math.abs(today - noteDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays <= 7) {
          groups['Last 7 Days'].push(note);
        } else {
          groups['Older'].push(note);
        }
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  };

  const deleteNote = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await api.delete(`/notes/${id}`);
        const updatedNotes = notes.filter(n => n.id !== id);
        setNotes(updatedNotes);
        setGroupedNotes(groupNotesByDate(updatedNotes));
      } catch (err) {
        alert('Failed to delete note');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] transition-colors duration-300 pb-12">
      <header className="bg-white/80 dark:bg-[#16171d]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary-500/10 rounded-xl">
            <Clock className="w-7 h-7 text-primary-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your History</h1>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : Object.keys(groupedNotes).length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#16171d] rounded-2xl border border-gray-200 dark:border-gray-800">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No notes found</h3>
            <p className="text-gray-500 dark:text-gray-400">You haven't recorded anything yet.</p>
          </div>
        ) : (
          <div ref={gridRef} className="bento-section space-y-12 relative">
            <GlobalSpotlight gridRef={gridRef} glowColor="59, 130, 246" />
            {Object.entries(groupedNotes).map(([groupName, groupNotes]) => (
              <div key={groupName} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  {groupName}
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full ml-2">
                    {groupNotes.length}
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupNotes.map(note => (
                    <ParticleCard
                      key={note.id}
                      className="magic-bento-card magic-bento-card--border-glow bg-white dark:bg-[#16171d] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer group hover:-translate-y-1 flex flex-col h-full relative"
                      style={{ '--glow-color': '59, 130, 246', minHeight: 'unset', aspectRatio: 'unset' }}
                      glowColor="59, 130, 246"
                      enableTilt={true}
                      enableMagnetism={true}
                      clickEffect={true}
                    >
                      <div onClick={() => navigate(`/notes/${note.id}`)} className="w-full h-full flex flex-col">
                        <button 
                          onClick={(e) => deleteNote(e, note.id)}
                          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100 z-10"
                          title="Delete Note"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 pr-8 group-hover:text-primary-500 transition-colors">
                          {note.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-grow">
                          {note.summary || note.rawTranscript}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                          <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>{note.audioUrl ? 'Audio attached' : 'Text only'}</span>
                        </div>
                      </div>
                    </ParticleCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
