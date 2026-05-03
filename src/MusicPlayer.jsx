import { useState, useRef, useEffect, useCallback } from "react";

// ─── IndexedDB helpers ───────────────────────────────────────────────────────
const DB_NAME = "aura-music-db";
const DB_VERSION = 1;
const STORE = "tracks";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(track) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(track);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function fileToStoredTrack(file) {
  const buffer = await file.arrayBuffer();
  const colors = [
    ["#4299e1", "#667eea"], ["#ed64a6", "#9f7aea"],
    ["#f6ad55", "#fc8181"], ["#68d391", "#63b3ed"],
    ["#b794f4", "#ed64a6"], ["#fc8181", "#f6ad55"],
  ];
  const emojis = ["🎵", "🎶", "🎸", "🥁", "🎹", "🎺", "🎻", "🪗", "🪘"];
  const [c1, c2] = colors[Math.floor(Math.random() * colors.length)];
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: file.name.replace(/\.[^/.]+$/, ""),
    artist: "Local File",
    duration: "—",
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    color1: c1, color2: c2, genre: "Local",
    mimeType: file.type || "audio/mpeg",
    buffer,
  };
}

function bufferToObjectURL(track) {
  const blob = new Blob([track.buffer], { type: track.mimeType });
  return URL.createObjectURL(blob);
}

const formatTime = (s) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const VISUALIZER_BARS = 48;
const generateColor = (i) => `hsl(${(i / VISUALIZER_BARS) * 60 + 200}, 90%, 65%)`;

const TrackCard = ({ track, isActive, onClick, onDelete }) => (
  <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", borderRadius: "14px", background: isActive ? "linear-gradient(135deg,rgba(99,179,237,.18),rgba(159,122,234,.18))" : "rgba(255,255,255,.03)", border: isActive ? "1px solid rgba(99,179,237,.35)" : "1px solid rgba(255,255,255,.06)", cursor: "pointer", transition: "all .25s", marginBottom: "8px", position: "relative", overflow: "hidden" }}>
    {isActive && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "linear-gradient(180deg,#63b3ed,#9f7aea)", borderRadius: "0 3px 3px 0" }} />}
    <div style={{ width: "46px", height: "46px", borderRadius: "10px", flexShrink: 0, background: `linear-gradient(135deg,${track.color1},${track.color2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: isActive ? `0 4px 16px ${track.color1}55` : "none" }}>{track.emoji}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "14px", color: isActive ? "#e2e8f0" : "#a0aec0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
      <div style={{ fontSize: "12px", color: "#4a5568", marginTop: "2px", fontFamily: "'DM Sans',sans-serif" }}>{track.artist} · {track.genre}</div>
    </div>
    <div style={{ fontSize: "12px", color: "#4a5568", fontFamily: "'DM Sans',sans-serif", marginRight: "4px" }}>{track.duration}</div>
    {isActive && (
      <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "20px", marginRight: "6px" }}>
        {[0, 1, 2].map((i) => (<div key={i} style={{ width: "3px", borderRadius: "2px", background: "linear-gradient(180deg,#63b3ed,#9f7aea)", animation: `eqBar ${0.6 + i * 0.15}s ease-in-out infinite alternate`, animationDelay: `${i * 0.1}s` }} />))}
      </div>
    )}
    {onDelete && (
      <button onClick={(e) => { e.stopPropagation(); onDelete(track.id); }} style={{ background: "rgba(255,255,255,.06)", border: "none", borderRadius: "8px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#718096", fontSize: "14px", flexShrink: 0 }}>✕</button>
    )}
  </div>
);

const DEMO_TRACKS = [
  { id: 1, title: "Neon Drift",       artist: "Synthwave Collective", duration: "3:42", emoji: "🌊", color1: "#4299e1", color2: "#667eea", genre: "Synthwave" },
  { id: 2, title: "Midnight Circuit", artist: "Binary Dreams",        duration: "4:11", emoji: "⚡", color1: "#ed64a6", color2: "#9f7aea", genre: "Electronic" },
  { id: 3, title: "Desert Bloom",     artist: "Terra Nova",           duration: "3:55", emoji: "🌵", color1: "#f6ad55", color2: "#fc8181", genre: "Ambient" },
  { id: 4, title: "Glass Canopy",     artist: "Mira & The Echoes",    duration: "5:03", emoji: "🪩", color1: "#68d391", color2: "#63b3ed", genre: "Indie" },
  { id: 5, title: "Crimson Protocol", artist: "Axiom",                duration: "3:28", emoji: "🔴", color1: "#fc8181", color2: "#f6ad55", genre: "Electronic" },
  { id: 6, title: "Lunar Static",     artist: "Void Signal",          duration: "4:47", emoji: "🌙", color1: "#b794f4", color2: "#63b3ed", genre: "Ambient" },
];

export default function MusicPlayer() {
  const [userTracks, setUserTracks]       = useState([]);
  const [activeTrackId, setActiveTrackId] = useState(DEMO_TRACKS[0].id);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [progress, setProgress]           = useState(0);
  const [currentTime, setCurrentTime]     = useState(0);
  const [duration, setDuration]           = useState(0);
  const [volume, setVolume]               = useState(0.8);
  const [isMuted, setIsMuted]             = useState(false);
  const [shuffle, setShuffle]             = useState(false);
  const [repeat, setRepeat]               = useState("none");
  const [view, setView]                   = useState("player");
  const [bars, setBars]                   = useState(Array(VISUALIZER_BARS).fill(4));
  const [importing, setImporting]         = useState(false);
  const [toast, setToast]                 = useState(null);

  const audioRef     = useRef(null);
  const fileInputRef = useRef(null);
  const animFrameRef = useRef(null);
  const objectURLs   = useRef({});

  const allTracks   = [...DEMO_TRACKS, ...userTracks];
  const activeTrack = allTracks.find((t) => t.id === activeTrackId) || allTracks[0];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // Load from IndexedDB on mount
  useEffect(() => {
    dbGetAll().then((stored) => {
      const tracks = stored.map((t) => {
        const url = bufferToObjectURL(t);
        objectURLs.current[t.id] = url;
        return { ...t, src: url };
      });
      setUserTracks(tracks);
    }).catch(() => {});
  }, []);

  // Visualizer
  const simulateVisualizer = useCallback(() => {
    const animate = () => {
      setBars((prev) => prev.map((_, i) => {
        const base = isPlaying ? Math.random() * 60 + 10 : 4;
        const wave = Math.sin(Date.now() / 200 + i * 0.4) * 15;
        return Math.max(4, Math.min(80, base + wave));
      }));
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying]);

  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    simulateVisualizer();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [simulateVisualizer]);

  // Demo progress simulation
  useEffect(() => {
    let interval;
    const isDemo = DEMO_TRACKS.some((t) => t.id === activeTrackId);
    if (isPlaying && isDemo) {
      const totalSec = 240;
      setDuration(totalSec);
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          if (next >= totalSec) { handleNext(); return 0; }
          setProgress((next / totalSec) * 100);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeTrackId]);

  // Audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => { setCurrentTime(audio.currentTime); setProgress((audio.currentTime / audio.duration) * 100 || 0); };
    const onLoad = () => setDuration(audio.duration);
    const onEnd  = () => handleNext();
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoad);
    audio.addEventListener("ended", onEnd);
    return () => { audio.removeEventListener("timeupdate", onTime); audio.removeEventListener("loadedmetadata", onLoad); audio.removeEventListener("ended", onEnd); };
  }, []);

  const selectTrack = (track, autoPlay = false) => {
    setActiveTrackId(track.id);
    setCurrentTime(0); setProgress(0);
    if (track.src && audioRef.current) {
      audioRef.current.src = track.src;
      if (autoPlay || isPlaying) { audioRef.current.play(); setIsPlaying(true); }
    } else {
      if (audioRef.current) { audioRef.current.src = ""; audioRef.current.pause(); }
      if (autoPlay) setIsPlaying(true);
    }
  };

  const handleNext = () => {
    const idx  = allTracks.findIndex((t) => t.id === activeTrackId);
    const next = shuffle ? Math.floor(Math.random() * allTracks.length) : (idx + 1) % allTracks.length;
    selectTrack(allTracks[next], true);
  };

  const handlePrev = () => {
    if (currentTime > 3) { setCurrentTime(0); setProgress(0); if (audioRef.current) audioRef.current.currentTime = 0; return; }
    const idx  = allTracks.findIndex((t) => t.id === activeTrackId);
    const prev = (idx - 1 + allTracks.length) % allTracks.length;
    selectTrack(allTracks[prev], true);
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (audio?.src) { if (isPlaying) audio.pause(); else audio.play(); }
    setIsPlaying((p) => !p);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(pct * 100);
    const dur = audioRef.current?.duration || 240;
    const t   = pct * dur;
    setCurrentTime(t);
    if (audioRef.current?.src) audioRef.current.currentTime = t;
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0) setIsMuted(false);
  };

  const handleMute = () => setIsMuted((m) => { if (audioRef.current) audioRef.current.muted = !m; return !m; });

  // Import → IndexedDB
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setImporting(true);
    const newTracks = [];
    for (const file of files) {
      const stored = await fileToStoredTrack(file);
      await dbPut(stored);
      const url = bufferToObjectURL(stored);
      objectURLs.current[stored.id] = url;
      newTracks.push({ ...stored, src: url });
    }
    setUserTracks((prev) => [...prev, ...newTracks]);
    setImporting(false);
    showToast(`✅ ${files.length} track${files.length > 1 ? "s" : ""} saved permanently`);
    e.target.value = "";
  };

  const handleDelete = async (id) => {
    await dbDelete(id);
    if (objectURLs.current[id]) { URL.revokeObjectURL(objectURLs.current[id]); delete objectURLs.current[id]; }
    setUserTracks((prev) => prev.filter((t) => t.id !== id));
    if (activeTrackId === id) selectTrack(DEMO_TRACKS[0]);
    showToast("🗑️ Track removed");
  };

  const handleClearAll = async () => {
    await dbClear();
    Object.values(objectURLs.current).forEach(URL.revokeObjectURL);
    objectURLs.current = {};
    setUserTracks([]);
    selectTrack(DEMO_TRACKS[0]);
    showToast("🗑️ Library cleared");
  };

  const repeatActive = repeat !== "none";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050508; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans',sans-serif; }
        @keyframes eqBar    { from { height: 6px; } to { height: 18px; } }
        @keyframes float    { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(3deg); } }
        @keyframes pulse-ring { 0% { transform:scale(1);opacity:.6; } 100% { transform:scale(1.3);opacity:0; } }
        @keyframes fadeIn   { from { opacity:0;transform:translateY(8px); } to { opacity:1;transform:none; } }
        .progress-bar-container { cursor:pointer;padding:8px 0; }
        .progress-bar-track { height:4px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;transition:height .2s; }
        .progress-bar-container:hover .progress-bar-track { height:6px; }
        .volume-slider { -webkit-appearance:none;appearance:none;height:3px;background:rgba(255,255,255,.1);border-radius:3px;outline:none;cursor:pointer;width:100%; }
        .volume-slider::-webkit-slider-thumb { -webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#63b3ed;cursor:pointer;box-shadow:0 0 6px rgba(99,179,237,.6); }
        .ctrl-btn { background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all .2s;color:#718096;padding:8px; }
        .ctrl-btn:hover { color:#e2e8f0;background:rgba(255,255,255,.06); }
        .ctrl-btn.active { color:#63b3ed; }
        .play-btn { width:60px;height:60px;border-radius:50%;border:none;background:linear-gradient(135deg,#63b3ed,#9f7aea);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 30px rgba(99,179,237,.4),0 0 60px rgba(159,122,234,.2);transition:all .2s;position:relative; }
        .play-btn:hover { transform:scale(1.06); }
        .play-btn:active { transform:scale(.96); }
        .tab-btn { flex:1;padding:10px;border:none;border-radius:10px;cursor:pointer;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;letter-spacing:.04em;transition:all .2s; }
        .toast { position:absolute;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(30,30,45,.95);border:1px solid rgba(99,179,237,.3);border-radius:12px;padding:10px 18px;font-size:13px;color:#e2e8f0;white-space:nowrap;animation:fadeIn .3s ease;backdrop-filter:blur(12px);z-index:99;font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08);border-radius:4px; }
      `}</style>

      <audio ref={audioRef} />

      <div style={{ position:"fixed",inset:0,background:"#050508",zIndex:0,overflow:"hidden" }}>
        <div style={{ position:"absolute",top:"-20%",left:"-10%",width:"50%",height:"50%",borderRadius:"50%",background:`radial-gradient(circle,${activeTrack.color1}22 0%,transparent 70%)`,filter:"blur(60px)",transition:"all 1.5s ease" }} />
        <div style={{ position:"absolute",bottom:"-20%",right:"-10%",width:"50%",height:"50%",borderRadius:"50%",background:`radial-gradient(circle,${activeTrack.color2}22 0%,transparent 70%)`,filter:"blur(60px)",transition:"all 1.5s ease" }} />
      </div>

      <div style={{ position:"relative",zIndex:1,width:"390px",maxHeight:"844px",minHeight:"700px",background:"rgba(10,10,18,.92)",backdropFilter:"blur(40px)",borderRadius:"40px",border:"1px solid rgba(255,255,255,.07)",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 50px 100px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.08)" }}>

        {toast && <div className="toast">{toast}</div>}

        {/* Header */}
        <div style={{ padding:"20px 24px 0",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"22px",background:"linear-gradient(135deg,#e2e8f0,#a0aec0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-.02em" }}>AURA</div>
            <div style={{ fontSize:"11px",color:"#4a5568",letterSpacing:".12em" }}>MUSIC PLAYER</div>
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            style={{ background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"12px",padding:"8px 14px",color:importing?"#4a5568":"#a0aec0",fontSize:"12px",cursor:importing?"default":"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,display:"flex",alignItems:"center",gap:"6px" }}>
            {importing ? "⏳ Saving…" : "＋ Import"}
          </button>
          <input ref={fileInputRef} type="file" accept="audio/*" multiple style={{ display:"none" }} onChange={handleFileUpload} />
        </div>

        {/* Tabs */}
        <div style={{ margin:"16px 24px",background:"rgba(255,255,255,.04)",borderRadius:"14px",padding:"4px",display:"flex",gap:"4px" }}>
          {["player","library"].map((v) => (
            <button key={v} className="tab-btn" onClick={() => setView(v)}
              style={{ background:view===v?"linear-gradient(135deg,rgba(99,179,237,.2),rgba(159,122,234,.2))":"transparent",color:view===v?"#e2e8f0":"#4a5568",border:view===v?"1px solid rgba(99,179,237,.25)":"1px solid transparent" }}>
              {v === "player" ? "Now Playing" : `Library (${userTracks.length})`}
            </button>
          ))}
        </div>

        {/* Player */}
        {view === "player" && (
          <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"0 24px 32px" }}>
            <div style={{ display:"flex",justifyContent:"center",marginBottom:"24px" }}>
              <div style={{ position:"relative" }}>
                {isPlaying && <div style={{ position:"absolute",inset:"-20px",borderRadius:"50%",background:`radial-gradient(circle,${activeTrack.color1}30 0%,transparent 70%)`,animation:"pulse-ring 2s ease-out infinite" }} />}
                <div style={{ width:"180px",height:"180px",borderRadius:"28px",background:`linear-gradient(135deg,${activeTrack.color1},${activeTrack.color2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"72px",boxShadow:`0 20px 60px ${activeTrack.color1}44,0 8px 32px rgba(0,0,0,.5)`,animation:isPlaying?"float 4s ease-in-out infinite":"none",transition:"all .5s",position:"relative",zIndex:1 }}>
                  {activeTrack.emoji}
                </div>
              </div>
            </div>

            <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"center",gap:"3px",height:"60px",marginBottom:"20px" }}>
              {bars.map((h,i) => (<div key={i} style={{ width:"4px",height:`${h}%`,background:generateColor(i),borderRadius:"2px",transition:"height .1s ease",opacity:isPlaying?.8:.2 }} />))}
            </div>

            <div style={{ marginBottom:"20px" }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"22px",color:"#e2e8f0",letterSpacing:"-.02em",marginBottom:"4px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{activeTrack.title}</div>
              <div style={{ color:"#4a5568",fontSize:"14px" }}>{activeTrack.artist} · {activeTrack.genre}</div>
            </div>

            <div style={{ marginBottom:"20px" }}>
              <div className="progress-bar-container" onClick={handleSeek}>
                <div className="progress-bar-track">
                  <div style={{ height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${activeTrack.color1},${activeTrack.color2})`,borderRadius:"4px",transition:"width .1s linear" }} />
                </div>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",marginTop:"6px",fontSize:"12px",color:"#4a5568" }}>
                <span>{formatTime(currentTime)}</span><span>{formatTime(duration||240)}</span>
              </div>
            </div>

            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px" }}>
              <button className={`ctrl-btn ${shuffle?"active":""}`} onClick={() => setShuffle((s)=>!s)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
              </button>
              <button className="ctrl-btn" onClick={handlePrev}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 20L9 12l10-8v16z"/><line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2"/></svg>
              </button>
              <button className="play-btn" onClick={handlePlayPause}>
                {isPlaying
                  ? <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                  : <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{marginLeft:"3px"}}><polygon points="5,3 19,12 5,21"/></svg>}
              </button>
              <button className="ctrl-btn" onClick={handleNext}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4l10 8-10 8V4z"/><line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2"/></svg>
              </button>
              <button className={`ctrl-btn ${repeatActive?"active":""}`} onClick={() => setRepeat((r)=>r==="none"?"all":r==="all"?"one":"none")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>{repeat==="one"&&<><line x1="12" y1="11" x2="12" y2="17"/><line x1="10" y1="11" x2="12" y2="11"/></>}</svg>
              </button>
            </div>

            <div style={{ display:"flex",alignItems:"center",gap:"10px",background:"rgba(255,255,255,.03)",borderRadius:"12px",padding:"10px 14px" }}>
              <button className="ctrl-btn" onClick={handleMute} style={{padding:"4px"}}>
                {isMuted||volume===0
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>}
              </button>
              <input type="range" min="0" max="1" step="0.01" value={isMuted?0:volume} onChange={handleVolumeChange} className="volume-slider" />
              <span style={{fontSize:"12px",color:"#4a5568",minWidth:"28px",textAlign:"right"}}>{Math.round((isMuted?0:volume)*100)}%</span>
            </div>
          </div>
        )}

        {/* Library */}
        {view === "library" && (
          <div style={{ flex:1,overflowY:"auto",padding:"0 24px 32px" }}>
            {userTracks.length > 0 && (
              <div style={{ marginBottom:"20px" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px" }}>
                  <div style={{ fontSize:"11px",color:"#4a5568",letterSpacing:".12em",fontFamily:"'Syne',sans-serif",fontWeight:700 }}>YOUR MUSIC ({userTracks.length})</div>
                  <button onClick={handleClearAll} style={{ background:"none",border:"none",cursor:"pointer",fontSize:"11px",color:"#4a5568",fontFamily:"'DM Sans',sans-serif",letterSpacing:".06em" }}>CLEAR ALL</button>
                </div>
                {userTracks.map((track) => (
                  <TrackCard key={track.id} track={track} isActive={track.id===activeTrackId}
                    onClick={() => { selectTrack(track,true); setView("player"); }}
                    onDelete={handleDelete} />
                ))}
              </div>
            )}
            <div>
              <div style={{ fontSize:"11px",color:"#4a5568",letterSpacing:".12em",marginBottom:"10px",fontFamily:"'Syne',sans-serif",fontWeight:700 }}>DEMO TRACKS</div>
              {DEMO_TRACKS.map((track) => (
                <TrackCard key={track.id} track={track} isActive={track.id===activeTrackId}
                  onClick={() => { setActiveTrackId(track.id); setCurrentTime(0); setProgress(0); setIsPlaying(true); setView("player"); }} />
              ))}
            </div>
            <div onClick={() => fileInputRef.current?.click()} style={{ marginTop:"20px",padding:"24px 20px",borderRadius:"16px",border:"1px dashed rgba(255,255,255,.1)",textAlign:"center",cursor:"pointer" }}>
              <div style={{ fontSize:"28px",marginBottom:"8px" }}>🎵</div>
              <div style={{ color:"#a0aec0",fontSize:"13px",fontFamily:"'Syne',sans-serif",fontWeight:600 }}>Import Audio Files</div>
              <div style={{ color:"#4a5568",fontSize:"12px",marginTop:"4px" }}>MP3 · FLAC · WAV · OGG · M4A</div>
              <div style={{ color:"#2d3748",fontSize:"11px",marginTop:"8px" }}>Saved permanently — import once, play forever</div>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ padding:"12px 24px 20px",borderTop:"1px solid rgba(255,255,255,.04)",display:"flex",justifyContent:"space-around" }}>
          {[{icon:"🎵",label:"Now Playing",v:"player"},{icon:"📚",label:"Library",v:"library"}].map(({icon,label,v}) => (
            <button key={v} onClick={() => setView(v)} style={{ background:view===v?"rgba(99,179,237,.08)":"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",padding:"6px 20px",borderRadius:"12px",transition:"all .2s" }}>
              <span style={{fontSize:"18px"}}>{icon}</span>
              <span style={{fontSize:"10px",letterSpacing:".08em",color:view===v?"#63b3ed":"#4a5568",fontFamily:"'Syne',sans-serif",fontWeight:700}}>{label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}