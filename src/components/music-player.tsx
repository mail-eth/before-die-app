"use client";

import { useState, useEffect, useRef } from "react";

const TRACKS = [
  {
    name: "Gymnopédie No. 1",
    artist: "Erik Satie",
    src: "https://archive.org/download/Serenity_Classical_Piano_CD/04%20-%20Gymnop%C3%A9die%20No%201.mp3",
  },
  {
    name: "Clair de Lune",
    artist: "Debussy",
    src: "https://archive.org/download/Serenity_Classical_Piano_CD/02%20-%20Clair%20de%20Lune.mp3",
  },
  {
    name: "World Peace",
    artist: "Ambient",
    src: "https://archive.org/download/audiorezout-mindfulness/01.World%20Peace.mp3",
  },
];

export function MusicPlayer() {
  const [enabled, setEnabled] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.15);
  const [showControls, setShowControls] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("quietwall-music");
    if (saved) {
      const { enabled: wasEnabled, volume: savedVolume } = JSON.parse(saved);
      setEnabled(wasEnabled !== undefined ? wasEnabled : true);
      setVolume(savedVolume || 0.15);
    } else {
      // Default on, low volume
      setEnabled(true);
      setVolume(0.15);
    }
  }, []);

  const toggleMusic = () => {
    const next = !enabled;
    setEnabled(next);
    setShowControls(next);
    if (audioRef.current) {
      if (next) {
        audioRef.current.play().catch(() => {});
        setPlaying(true);
      } else {
        audioRef.current.pause();
        setPlaying(false);
      }
    }
    localStorage.setItem(
      "quietwall-music",
      JSON.stringify({ enabled: next, volume: 0.15 })
    );
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setPlaying(!playing);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    localStorage.setItem(
      "quietwall-music",
      JSON.stringify({ enabled, volume: newVolume })
    );
  };

  const nextTrack = () => {
    const next = (currentTrack + 1) % TRACKS.length;
    setCurrentTrack(next);
    if (audioRef.current) {
      audioRef.current.src = TRACKS[next].src;
      if (playing) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  if (!enabled) {
    return (
      <button
        onClick={toggleMusic}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-[#C4A882] p-3 text-white shadow-lg transition hover:bg-[#b39a72] hover:scale-105"
        title="Enable ambient music"
      >
        🎵
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <audio
        ref={audioRef}
        src={TRACKS[currentTrack].src}
        onEnded={handleTrackEnd}
        loop={false}
      />

      {/* Music toggle button */}
      <button
        onClick={toggleMusic}
        className="rounded-full bg-[#C4A882] p-3 text-white shadow-lg transition hover:bg-[#b39a72]"
      >
        🔊
      </button>

      {/* Controls panel */}
      {showControls && (
        <div className="absolute bottom-full right-0 mb-2 w-56 rounded-2xl bg-[#F7F4F0] p-4 shadow-xl border border-[#C4A882]/20">
          {/* Track info */}
          <div className="mb-3 text-center">
            <p className="text-sm font-medium text-[#3D3A36]">
              {TRACKS[currentTrack].name}
            </p>
            <p className="text-xs text-[#8A857D]">{TRACKS[currentTrack].artist}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={togglePlay}
              className="rounded-full bg-[#C4A882] p-2 text-white hover:bg-[#b39a72]"
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              onClick={nextTrack}
              className="rounded-full bg-[#8FAF9A] p-2 text-white hover:bg-[#7a9c85]"
            >
              ⏭
            </button>
          </div>

          {/* Volume */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-[#8A857D]">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolume}
              className="h-1 flex-1 cursor-pointer accent-[#C4A882]"
            />
            <span className="text-xs text-[#8A857D]">🔊</span>
          </div>

          {/* Privacy note */}
          <p className="mt-3 text-center text-[10px] text-[#8A857D]">
            🎧 Music off by default
          </p>
        </div>
      )}
    </div>
  );
}