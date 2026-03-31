import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Maximize, Settings, FastForward } from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';

export const StrictVideoPlayer = ({ src, onComplete, lessonId }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [maxTimeWatched, setMaxTimeWatched] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    const speedOptions = [1, 1.5, 2, 3];

    // --- GOOGLE DRIVE & YOUTUBE LOGIC ---
    const getProcessedSrc = (url) => {
        if (!url) return "";
        
        // Handle Google Drive
        if (url.includes('drive.google.com')) {
            const match = url.match(/\/d\/(.+?)\/(view|edit|usp=sharing|preview)/) || url.match(/id=(.+?)(&|$)/);
            const fileId = match ? match[1] : null;
            if (fileId) {
                return { type: 'drive', id: fileId };
            }
        }

        // Handle YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const match = url.match(/(?:v=|\/embed\/|youtu.be\/)([^&?#/]+)/);
            return match ? { type: 'youtube', id: match[1] } : url;
        }

        return url;
    };

    const processed = getProcessedSrc(src);
    const isYouTube = typeof processed === 'object' && processed.type === 'youtube';
    const isDrive = typeof processed === 'object' && processed.type === 'drive';

    // Reset state when source changes
    useEffect(() => {
        setMaxTimeWatched(0);
        setProgress(0);
    }, [src]);

    if (isYouTube || isDrive) {
        const embedSrc = isYouTube 
            ? `https://www.youtube.com/embed/${processed.id}?rel=0&modestbranding=1`
            : `https://drive.google.com/file/d/${processed.id}/preview`;
            
        return (
            <div style={{ width: '100%', height: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                <iframe
                    width="100%"
                    height="100%"
                    src={embedSrc}
                    title="Video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    onLoad={() => {
                        // Mark as complete after brief delay for external players
                        setTimeout(() => onComplete && onComplete(lessonId), 5000); 
                    }}
                />
            </div>
        );
    }

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        const current = videoRef.current.currentTime;
        const total = videoRef.current.duration;
        setDuration(total);
        setProgress((current / total) * 100);

        // Update max time watched if we are moving forward normally
        if (current > maxTimeWatched) {
            setMaxTimeWatched(current);
        }

        // Check if nearly finished (95%) to trigger completion
        if (current / total > 0.98 && onComplete) {
            onComplete(lessonId);
        }
    };

    const handleSeeking = (e) => {
        const newTime = (e.target.value / 100) * duration;
        
        // STRICT ENFORCEMENT: Only allow seeking backward
        // or forward up to what has already been watched.
        if (newTime <= maxTimeWatched + 1) { // 1s buffer
            videoRef.current.currentTime = newTime;
            setProgress(e.target.value);
        } else {
            // Snap back to max watched if they try to skip ahead
            videoRef.current.currentTime = maxTimeWatched;
            setProgress((maxTimeWatched / duration) * 100);
        }
    };

    const changeSpeed = (speed) => {
        videoRef.current.playbackRate = speed;
        setPlaybackRate(speed);
        setShowSpeedMenu(false);
    };

    const toggleFullscreen = () => {
        if (videoRef.current.requestFullscreen) {
            videoRef.current.requestFullscreen();
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden', group: 'player' }}>
            <video
                ref={videoRef}
                src={processed}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            {/* Premium Controls Overlay */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                opacity: 1, // Visible for now, can add hover logic
                transition: 'opacity 0.3s'
            }}>
                {/* Progress Bar */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeeking}
                    style={{
                        width: '100%',
                        height: '4px',
                        appearance: 'none',
                        background: `linear-gradient(to right, #0A84FF ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
                        borderRadius: '2px',
                        cursor: 'pointer',
                        outline: 'none'
                    }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                        </button>
                        
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, minWidth: '100px' }}>
                            {Math.floor(videoRef.current?.currentTime || 0)}s / {Math.floor(duration || 0)}s
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Volume2 size={18} color="white" />
                            <input 
                                type="range" 
                                min="0" max="1" step="0.1" 
                                value={volume} 
                                onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    videoRef.current.volume = v;
                                    setVolume(v);
                                }}
                                style={{ width: '60px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
                        {/* Speed Controls */}
                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                style={{ 
                                    background: 'rgba(255,255,255,0.1)', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    color: 'white', 
                                    padding: '4px 12px', 
                                    borderRadius: '8px', 
                                    fontSize: '0.8rem', 
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Settings size={14} /> {playbackRate}x
                            </button>

                            {showSpeedMenu && (
                                <GlassCard heavy style={{ 
                                    position: 'absolute', 
                                    bottom: '40px', 
                                    right: 0, 
                                    padding: '8px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '4px',
                                    zIndex: 100,
                                    minWidth: '80px'
                                }}>
                                    {speedOptions.map(speed => (
                                        <button 
                                            key={speed}
                                            onClick={() => changeSpeed(speed)}
                                            style={{ 
                                                background: playbackRate === speed ? 'rgba(10, 132, 255, 0.2)' : 'transparent',
                                                border: 'none',
                                                color: playbackRate === speed ? '#0A84FF' : 'white',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                            }}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </GlassCard>
                            )}
                        </div>

                        <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <Maximize size={20} />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Forward Lock Warning Overlay (Only shows when seeking invalid) */}
            <div id="seek-lock-warning" style={{ 
                position: 'absolute', 
                top: '20px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                background: 'rgba(255, 69, 58, 0.9)', 
                color: 'white', 
                padding: '8px 16px', 
                borderRadius: '12px', 
                fontSize: '0.8rem', 
                fontWeight: 800,
                display: 'none',
                zIndex: 200
            }}>
                Finish watched content to unlock forward seeking
            </div>
        </div>
    );
};
