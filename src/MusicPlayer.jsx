import { useState, useRef, useEffect, useCallback } from "react";

const formatTime = (s) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const VISUALIZER_BARS = 48;

const generateColor = (index) => {
  const hue = (index / VISUALIZER_BARS) * 60 + 200;
  return `hsl(${hue}, 90%, 65%)`;
};

const TrackCard = ({ track, isActive, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "12px 16px",
      borderRadius: "14px",
      background: isActive
        ? "linear-gradient(135deg, rgba(99,179,237,0.18) 0%, rgba(159,122,234,0.18) 100%)"
        : "rgba(255,255,255,0.03)",
      border: isActive
        ? "1px solid rgba(99,179,237,0.35)"
        : "1px solid rgba(255,255,255,0.06)",
      cursor: "pointer",
      transition: "all 0.25s ease",
      marginBottom: "8px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {isActive && (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: "linear-gradient(180deg, #63b3ed, #9f7aea)",
          borderRadius: "0 3px 3px 0",
        }}
      />
    )}
    <div
      style={{
        width: "46px",
        height: "46px",
        borderRadius: "10px",
        background: `linear-gradient(135deg, ${track.color1}, ${track.color2})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        flexShrink: 0,
        boxShadow: isActive ? `0 4px 16px ${track.color1}55` : "none",
      }}
    >
      {track.emoji}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          color: isActive ? "#e2e8f0" : "#a0aec0",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          letterSpacing: "0.01em",
        }}
      >
        {track.title}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#4a5568",
          marginTop: "2px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {track.artist}
      </div>
    </div>
    <div style={{ fontSize: "12px", color: "#4a5568", fontFamily: "'DM Sans', sans-serif" }}>
      {track.duration}
    </div>
    {isActive && (
      <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "20px" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "3px",
              borderRadius: "2px",
              background: "linear-gradient(180deg, #63b3ed, #9f7aea)",
              animation: `eqBar ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    )}
  </div>
);

export default function MusicPlayer() {
  const demoTracks = [
    {
      id: 1,
      title: "Neon Drift",
      artist: "Synthwave Collective",
      duration: "3:42",
      emoji: "🌊",
      color1: "#4299e1",
      color2: "#667eea",
      genre: "Synthwave",
    },
    {
      id: 2,
      title: "Midnight Circuit",
      artist: "Binary Dreams",
      duration: "4:11",
      emoji: "⚡",
      color1: "#ed64a6",
      color2: "#9f7aea",
      genre: "Electronic",
    },
    {
      id: 3,
      title: "Desert Bloom",
      artist: "Terra Nova",
      duration: "3:55",
      emoji: "🌵",
      color1: "#f6ad55",
      color2: "#fc8181",
      genre: "Ambient",
    },
    {
      id: 4,
      title: "Glass Canopy",
      artist: "Mira & The Echoes",
      duration: "5:03",
      emoji: "🪩",
      color1: "#68d391",
      color2: "#63b3ed",
      genre: "Indie",
    },
    {
      id: 5,
      title: "Crimson Protocol",
      artist: "Axiom",
      duration: "3:28",
      emoji: "🔴",
      color1: "#fc8181",
      color2: "#f6ad55",
      genre: "Electronic",
    },
    {
      id: 6,
      title: "Lunar Static",
      artist: "Void Signal",
      duration: "4:47",
      emoji: "🌙",
      color1: "#b794f4",
      color2: "#63b3ed",
      genre: "Ambient",
    },
  ];

  const [tracks] = useState(demoTracks);
  const [userTracks, setUserTracks] = useState([]);
  const [activeTrackId, setActiveTrackId] = useState(demoTracks[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("none"); // none | one | all
  const [view, setView] = useState("player"); // player | library
  const [bars, setBars] = useState(Array(VISUALIZER_BARS).fill(4));
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  const allTracks = [...tracks, ...userTracks];
  const activeTrack = allTracks.find((t) => t.id === activeTrackId) || allTracks[0];

  // Simulated visualizer when no real audio source
  const simulateVisualizer = useCallback(() => {
    const animate = () => {
      setBars((prev) =>
        prev.map((_, i) => {
          const base = isPlaying ? Math.random() * 60 + 10 : 4;
          const wave = Math.sin(Date.now() / 200 + i * 0.4) * 15;
          return Math.max(4, Math.min(80, base + wave));
        })
      );
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying]);

  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    simulateVisualizer();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [simulateVisualizer]);

  // Progress simulation for demo tracks
  useEffect(() => {
    let interval;
    if (isPlaying && !audioRef.current?.src) {
      const totalSec = 240;
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          if (next >= totalSec) {
            handleNext();
            return 0;
          }
          setProgress((next / totalSec) * 100);
          return next;
        });
      }, 1000);
      setDuration(240);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeTrackId]);

  // Audio element handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    const onLoad = () => setDuration(audio.duration);
    const onEnd = () => handleNext();
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoad);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoad);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (audio?.src) {
      if (isPlaying) audio.pause();
      else audio.play();
    }
    setIsPlaying((p) => !p);
  };

  const handleNext = () => {
    const idx = allTracks.findIndex((t) => t.id === activeTrackId);
    const next = shuffle
      ? Math.floor(Math.random() * allTracks.length)
      : (idx + 1) % allTracks.length;
    setActiveTrackId(allTracks[next].id);
    setCurrentTime(0);
    setProgress(0);
  };

  const handlePrev = () => {
    if (currentTime > 3) {
      setCurrentTime(0);
      setProgress(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    const idx = allTracks.findIndex((t) => t.id === activeTrackId);
    const prev = (idx - 1 + allTracks.length) % allTracks.length;
    setActiveTrackId(allTracks[prev].id);
    setCurrentTime(0);
    setProgress(0);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setProgress(pct * 100);
    const dur = audioRef.current?.duration || 240;
    const t = pct * dur;
    setCurrentTime(t);
    if (audioRef.current?.src) audioRef.current.currentTime = t;
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0) setIsMuted(false);
  };

  const handleMute = () => {
    setIsMuted((m) => {
      if (audioRef.current) audioRef.current.muted = !m;
      return !m;
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, "");
      const colors = [
        ["#4299e1", "#667eea"],
        ["#ed64a6", "#9f7aea"],
        ["#f6ad55", "#fc8181"],
        ["#68d391", "#63b3ed"],
      ];
      const [c1, c2] = colors[Math.floor(Math.random() * colors.length)];
      const emojis = ["🎵", "🎶", "🎸", "🥁", "🎹", "🎺", "🎻"];
      const newTrack = {
        id: Date.now() + Math.random(),
        title: name,
        artist: "Local File",
        duration: "—",
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        color1: c1,
        color2: c2,
        src: url,
        genre: "Local",
      };
      setUserTracks((prev) => [...prev, newTrack]);
    });
  };

  const handleTrackSelect = (track) => {
    setActiveTrackId(track.id);
    setCurrentTime(0);
    setProgress(0);
    setIsPlaying(true);
    if (track.src && audioRef.current) {
      audioRef.current.src = track.src;
      audioRef.current.play();
    }
  };

  const repeatIcon = repeat === "one" ? "🔂" : repeat === "all" ? "🔁" : "🔁";
  const repeatActive = repeat !== "none";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          background: #050508;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
        }

        @keyframes eqBar {
          from { height: 6px; }
          to { height: 18px; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .progress-bar-container {
          cursor: pointer;
          padding: 8px 0;
          position: relative;
        }

        .progress-bar-track {
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          overflow: hidden;
          transition: height 0.2s;
        }

        .progress-bar-container:hover .progress-bar-track {
          height: 6px;
        }

        .volume-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
          width: 80px;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #63b3ed;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(99,179,237,0.6);
        }

        .ctrl-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
          color: #718096;
          padding: 8px;
        }

        .ctrl-btn:hover {
          color: #e2e8f0;
          background: rgba(255,255,255,0.06);
        }

        .ctrl-btn.active {
          color: #63b3ed;
        }

        .play-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #63b3ed, #9f7aea);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 0 30px rgba(99,179,237,0.4), 0 0 60px rgba(159,122,234,0.2);
          transition: all 0.2s ease;
          position: relative;
        }

        .play-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 0 40px rgba(99,179,237,0.5), 0 0 80px rgba(159,122,234,0.3);
        }

        .play-btn:active { transform: scale(0.96); }

        .play-btn::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid rgba(99,179,237,0.3);
          animation: ${isPlaying ? 'pulse-ring 1.5s ease-out infinite' : 'none'};
        }

        .tab-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      <audio ref={audioRef} />

      {/* Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#050508",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${activeTrack.color1}22 0%, transparent 70%)`,
            filter: "blur(60px)",
            transition: "all 1.5s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${activeTrack.color2}22 0%, transparent 70%)`,
            filter: "blur(60px)",
            transition: "all 1.5s ease",
          }}
        />
      </div>

      {/* App Shell */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "390px",
          maxHeight: "844px",
          minHeight: "700px",
          background: "rgba(10,10,18,0.92)",
          backdropFilter: "blur(40px)",
          borderRadius: "40px",
          border: "1px solid rgba(255,255,255,0.07)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 50px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            padding: "20px 24px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "22px",
                background: "linear-gradient(135deg, #e2e8f0, #a0aec0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              AURA
            </div>
            <div style={{ fontSize: "11px", color: "#4a5568", letterSpacing: "0.12em" }}>
              MUSIC PLAYER
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "8px 14px",
              color: "#a0aec0",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: "14px" }}>＋</span> Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            margin: "16px 24px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "14px",
            padding: "4px",
            display: "flex",
            gap: "4px",
          }}
        >
          {["player", "library"].map((v) => (
            <button
              key={v}
              className="tab-btn"
              onClick={() => setView(v)}
              style={{
                background:
                  view === v
                    ? "linear-gradient(135deg, rgba(99,179,237,0.2), rgba(159,122,234,0.2))"
                    : "transparent",
                color: view === v ? "#e2e8f0" : "#4a5568",
                border: view === v ? "1px solid rgba(99,179,237,0.25)" : "1px solid transparent",
              }}
            >
              {v === "player" ? "Now Playing" : `Library (${allTracks.length})`}
            </button>
          ))}
        </div>

        {/* Player View */}
        {view === "player" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 32px" }}>
            {/* Album Art */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <div style={{ position: "relative" }}>
                {isPlaying && (
                  <div
                    style={{
                      position: "absolute",
                      inset: "-20px",
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${activeTrack.color1}30 0%, transparent 70%)`,
                      animation: "pulse-ring 2s ease-out infinite",
                    }}
                  />
                )}
                <div
                  style={{
                    width: "180px",
                    height: "180px",
                    borderRadius: "28px",
                    background: `linear-gradient(135deg, ${activeTrack.color1}, ${activeTrack.color2})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "72px",
                    boxShadow: `0 20px 60px ${activeTrack.color1}44, 0 8px 32px rgba(0,0,0,0.5)`,
                    animation: isPlaying ? "float 4s ease-in-out infinite" : "none",
                    transition: "all 0.5s ease",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {activeTrack.emoji}
                </div>
              </div>
            </div>

            {/* Visualizer */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: "3px",
                height: "60px",
                marginBottom: "20px",
              }}
            >
              {bars.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: "4px",
                    height: `${h}%`,
                    background: generateColor(i),
                    borderRadius: "2px",
                    transition: "height 0.1s ease",
                    opacity: isPlaying ? 0.8 : 0.2,
                  }}
                />
              ))}
            </div>

            {/* Track Info */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "22px",
                  color: "#e2e8f0",
                  letterSpacing: "-0.02em",
                  marginBottom: "4px",
                }}
              >
                {activeTrack.title}
              </div>
              <div style={{ color: "#4a5568", fontSize: "14px" }}>
                {activeTrack.artist} • {activeTrack.genre}
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: "20px" }}>
              <div
                className="progress-bar-container"
                onClick={handleSeek}
              >
                <div className="progress-bar-track">
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${activeTrack.color1}, ${activeTrack.color2})`,
                      borderRadius: "4px",
                      transition: "width 0.1s linear",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "#4a5568",
                }}
              >
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration || 240)}</span>
              </div>
            </div>

            {/* Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <button
                className={`ctrl-btn ${shuffle ? "active" : ""}`}
                onClick={() => setShuffle((s) => !s)}
                title="Shuffle"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8"/>
                  <line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/>
                  <line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
              </button>

              <button className="ctrl-btn" onClick={handlePrev} title="Previous">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 20L9 12l10-8v16z"/>
                  <line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>

              <button className="play-btn" onClick={handlePlayPause}>
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginLeft: "3px" }}>
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                )}
              </button>

              <button className="ctrl-btn" onClick={handleNext} title="Next">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 4l10 8-10 8V4z"/>
                  <line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>

              <button
                className={`ctrl-btn ${repeatActive ? "active" : ""}`}
                onClick={() =>
                  setRepeat((r) => (r === "none" ? "all" : r === "all" ? "one" : "none"))
                }
                title="Repeat"
              >
                {repeat === "one" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    <line x1="12" y1="11" x2="12" y2="17"/>
                    <line x1="10" y1="11" x2="12" y2="11"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Volume */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "12px",
                padding: "10px 14px",
              }}
            >
              <button className="ctrl-btn" onClick={handleMute} style={{ padding: "4px" }}>
                {isMuted || volume === 0 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: "12px", color: "#4a5568", minWidth: "28px", textAlign: "right" }}>
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Library View */}
        {view === "library" && (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 24px 32px",
            }}
          >
            {userTracks.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#4a5568",
                    letterSpacing: "0.12em",
                    marginBottom: "10px",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  YOUR FILES
                </div>
                {userTracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isActive={track.id === activeTrackId}
                    onClick={() => handleTrackSelect(track)}
                  />
                ))}
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#4a5568",
                  letterSpacing: "0.12em",
                  marginBottom: "10px",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                }}
              >
                DEMO TRACKS
              </div>
              {demoTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isActive={track.id === activeTrackId}
                  onClick={() => {
                    setActiveTrackId(track.id);
                    setCurrentTime(0);
                    setProgress(0);
                    setIsPlaying(true);
                    setView("player");
                  }}
                />
              ))}
            </div>

            {/* Import CTA */}
            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                borderRadius: "16px",
                border: "1px dashed rgba(255,255,255,0.1)",
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎵</div>
              <div style={{ color: "#a0aec0", fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                Import Audio Files
              </div>
              <div style={{ color: "#4a5568", fontSize: "12px", marginTop: "4px" }}>
                MP3, FLAC, WAV, OGG, M4A
              </div>
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <div
          style={{
            padding: "12px 24px 20px",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          {[
            { icon: "🎵", label: "Now Playing", v: "player" },
            { icon: "📚", label: "Library", v: "library" },
          ].map(({ icon, label, v }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "6px 20px",
                borderRadius: "12px",
                transition: "all 0.2s",
                background: view === v ? "rgba(99,179,237,0.08)" : "transparent",
              }}
            >
              <span style={{ fontSize: "18px" }}>{icon}</span>
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  color: view === v ? "#63b3ed" : "#4a5568",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                }}
              >
                {label.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
