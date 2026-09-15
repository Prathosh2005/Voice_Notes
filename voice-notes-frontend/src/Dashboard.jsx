import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { ThemeContext } from './ThemeContext';
import { Mic, LogOut, Clock, Share2, Square, Pause, Play, Upload, Moon, Sun, Loader2, History as HistoryIcon, Trash2 } from 'lucide-react';
import useAudioRecorder from './useAudioRecorder';
import api from './api';

// React Bits Components
import { ParticleCard, GlobalSpotlight } from './components/MagicBento';
import Dock from './components/Dock';
import GridScan from './components/GridScan';
import Orb from './components/Orb';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { isRecording, isPaused, formattedTime, mediaStream, startRecording, pauseRecording, resumeRecording, stopRecording } = useAudioRecorder();

  const [notes, setNotes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const gridRef = useRef(null);

  // 1. Drag State
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Load Notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate('/login');
          return;
        }
        const res = await api.get('/notes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotes(res.data);
      } catch (err) {
        console.error("Failed to load notes", err);
      }
    };
    fetchNotes();
  }, [navigate]);

  const handleStopRecording = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      await submitAudio(file);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await submitAudio(file);
    }
  };

  // 2. Drag Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await submitAudio(file);
    }
  };

  const submitAudio = async (file) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audioFile', file);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.post('/notes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 300000 // Explicit 5 minute timeout for large files
      });
      // Add new note to the top of the list
      setNotes([response.data, ...notes]);
    } catch (error) {
      console.error("Full Error Details:", error);
      const errorMessage = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
      alert("Backend Error: " + errorMessage);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };


  const deleteNote = (e, id) => {
    e.stopPropagation();
    setNoteToDelete(id);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login');
        return;
      }
      await api.delete(`/notes/${noteToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(notes.filter(n => n.id !== noteToDelete));
    } catch (err) {
      alert('Failed to delete note');
    } finally {
      setNoteToDelete(null);
    }
  };

  const dockItems = [
    { icon: <HistoryIcon size={22} />, label: 'History', onClick: () => navigate('/history') },
    { icon: theme === 'light' ? <Moon size={22} /> : <Sun size={22} />, label: 'Theme', onClick: toggleTheme },
    { icon: <LogOut size={22} />, label: 'Log out', onClick: logout },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300 relative overflow-hidden pb-24">
      
      {/* Global Background: Orb */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Orb 
          hoverIntensity={0.2}
          rotateOnHover={true}
          hue={0}
          forceHoverState={true}
          backgroundColor={theme === 'dark' ? '#0f172a' : '#f8fafc'}
        />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10">
        <header className="bg-white/80 dark:bg-[#16171d]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary-500/10 rounded-lg">
                  <Mic className="w-6 h-6 text-primary-500" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">VoxNote</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm hidden sm:block text-gray-500 dark:text-gray-400">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Recording Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* 3. UI Integration: Attach Handlers and Dynamic Tailwind Class */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`rounded-2xl p-8 lg:p-12 border shadow-sm text-center transition-colors duration-300 overflow-hidden relative ${isDragging
                    ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-900/40 dark:border-primary-500 backdrop-blur-sm'
                    : 'bg-white/80 dark:bg-[#16171d]/80 border-gray-200 dark:border-gray-800 backdrop-blur-sm'
                  }`}
              >

                {!isProcessing ? (
                  <>
                    {isRecording ? (
                      <div className="relative w-full overflow-hidden rounded-3xl">
                        <div className="absolute inset-0 z-0 pointer-events-none">
                          <GridScan
                            sensitivity={0.55}
                            lineThickness={1}
                            linesColor="#2F293A"
                            gridScale={0.1}
                            scanColor="#FF9FFC"
                            scanOpacity={0.4}
                            enablePost={true}
                            bloomIntensity={0.6}
                            chromaticAberration={0.002}
                            noiseIntensity={0.01}
                          />
                        </div>
                        <div className="relative z-10 flex flex-col items-center justify-center w-full py-6">
                          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                            Recording in progress...
                          </h2>
                          <p className="text-gray-500 dark:text-gray-400 mb-8 h-6">
                            <span className="text-red-500 font-mono text-lg animate-pulse">{formattedTime}</span>
                          </p>
                          <div className="flex flex-col items-center justify-center w-full">
                            <div className="relative flex items-center justify-center w-48 h-48 my-4 mx-auto">
                              <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20" style={{ animationDuration: '2s' }}></div>
                              <div className="absolute inset-4 bg-primary-500 rounded-full animate-ping opacity-30" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                              <div className="relative z-10 w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/50">
                                <Mic className="w-10 h-10 text-white animate-pulse" />
                              </div>
                            </div>

                            <div className="flex items-center justify-center gap-8 relative z-10 mt-8">
                              <button
                                onClick={isPaused ? resumeRecording : pauseRecording}
                                className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-all shadow-md text-gray-700 dark:text-gray-300 hover:scale-105"
                              >
                                {isPaused ? <Play className="w-6 h-6 ml-1" /> : <Pause className="w-6 h-6" />}
                              </button>
                              <button
                                onClick={handleStopRecording}
                                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-xl shadow-red-500/30 hover:scale-105 text-white"
                              >
                                <Square className="w-8 h-8 fill-current" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full py-6">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 relative z-10">
                          Ready to Record?
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 h-6 relative z-10">
                          Click the microphone to start capturing your thoughts.
                        </p>
                        <button
                          onClick={startRecording}
                          className="w-32 h-32 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center mx-auto transition-all shadow-xl shadow-primary-500/30 hover:scale-105 relative z-10 group"
                        >
                          <Mic className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    )}

                    {!isRecording && (
                      <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 relative z-10">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {isDragging ? "Drop your audio file here..." : "Or drag and drop an audio file here"}
                        </p>
                        <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-medium shadow-sm">
                          <Upload className="w-5 h-5" />
                          Choose Audio File
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-primary-500 animate-spin mb-6" />
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Analyzing your audio...</h2>
                    <p className="text-gray-500 dark:text-gray-400">Transcribing and generating AI summary using AssemblyAI & Gemini.</p>

                    {/* Loading Skeleton */}
                    <div className="w-full max-w-md mt-10 space-y-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse mx-auto"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse mx-auto"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse mx-auto"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Notes Sidebar */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-500" /> Recent Notes
                </div>
                <button onClick={() => navigate('/history')} className="text-sm text-primary-500 hover:underline">View All</button>
              </h3>

              <div ref={gridRef} className="bento-section space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar relative">
                <GlobalSpotlight gridRef={gridRef} glowColor="59, 130, 246" />
                
                {notes.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">No notes yet. Start recording!</p>
                )}

                {notes.map((note) => (
                  <ParticleCard
                    key={note.id}
                    className="magic-bento-card magic-bento-card--border-glow bg-white/60 dark:bg-[#16171d]/60 backdrop-blur-md p-5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm cursor-pointer group hover:-translate-y-1 relative"
                    style={{ '--glow-color': '59, 130, 246', minHeight: 'unset', aspectRatio: 'unset' }}
                    glowColor="59, 130, 246"
                    enableTilt={true}
                    enableMagnetism={true}
                    clickEffect={true}
                  >
                    <div onClick={() => navigate(`/notes/${note.id}`)} className="w-full h-full">
                      <button
                        onClick={(e) => deleteNote(e, note.id)}
                        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100 z-10"
                        title="Delete Note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 pr-8">{note.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                        {note.summary ? note.summary.split('\n')[0] : note.rawTranscript}
                      </p>
                      <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/notes/${note.id}`);
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-500 transition-all z-10"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </ParticleCard>
                ))}
              </div>
            </div>

          </div>
        </main>

        {/* Delete Confirmation Modal */}
        {noteToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#16171d] rounded-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-gray-800 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">Delete Note?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-6 text-sm">
                Are you sure you want to delete this note? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setNoteToDelete(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <Dock items={dockItems} />
      </div>
    </div>
  );
}
