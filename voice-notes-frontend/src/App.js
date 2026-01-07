import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);

  // 🎙️ Live recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunks.current = [];

    mediaRecorderRef.current.ondataavailable = e => chunks.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      setAudioBlob(new Blob(chunks.current, { type: "audio/wav" }));
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  // 📁 File upload
  const handleFileUpload = e => {
    setAudioBlob(e.target.files[0]);
  };

  // 🚀 Send audio
  const uploadAudio = async () => {
    if (!audioBlob) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", audioBlob);

    const res = await fetch("http://localhost:8080/api/audio/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setText(data.text);
    fetchHistory();
    setLoading(false);
  };

  // 📜 Fetch history
  const fetchHistory = async () => {
    const res = await fetch("http://localhost:8080/api/audio/history");
    const data = await res.json();
    setNotes(data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="app">
      <h1>🎤 Voice Notes AI</h1>
      <p className="subtitle">Record • Upload • Transcribe • Save</p>

      <div className="card">
        {!recording ? (
          <button onClick={startRecording}>🎙 Start Recording</button>
        ) : (
          <button className="stop" onClick={stopRecording}>⏹ Stop</button>
        )}

        <input type="file" accept="audio/*" onChange={handleFileUpload} />

        <button onClick={uploadAudio} disabled={loading}>
          {loading ? "Processing..." : "Convert to Text"}
        </button>
      </div>

      {text && (
        <div className="result">
          <h3>📝 Latest Transcript</h3>
          <p>{text}</p>
        </div>
      )}

      <div className="history">
        <h3>📜 Previous Notes</h3>
        {notes.map(note => (
          <div key={note.id} className="note">
            <small>{note.createdAt}</small>
            <p>{note.transcript}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
