import React, { useState, useEffect, useRef, useCallback } from 'react';
import localforage from 'localforage';
import api from '../../services/api';
import { Alert, Button } from '../../components/common/UIComponents';

export const ProctoringWrapper = ({ 
  exam, 
  attemptId, 
  currentQuestionId,
  questionIndex,
  totalQuestions,
  children,
  onPauseChange
}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const snapshotIntervalRef = useRef(null);
  const snappedQuestionsRef = useRef(new Set());
  // Track whether we've completed initial hardware init
  const initializedRef = useRef(false);
  
  const settings = exam?.settings || {};

  
  // Offline Queue Init
  const queueStore = localforage.createInstance({ name: 'ProctoringQueue' });

  // Browser check
  useEffect(() => {
    const ua = navigator.userAgent;
    if (ua.match(/Safari/i) && !ua.match(/Chrome/i)) setIsSupported(false);
    if (/Mobi|Android/i.test(ua)) setIsSupported(false);
  }, []);

  const hasLostCameraRef = useRef(false);
  const hasLostMicRef = useRef(false);

  // Violation Engine
  const logViolation = useCallback(async (type, severity, details = '') => {
    const payload = {
      attempt: attemptId,
      question: currentQuestionId,
      violation_type: type,
      severity,
      details
    };
    
    if (severity === 'Medium' || severity === 'High') {
      setWarnings(prev => prev + 1);
    }

    if (isOnline) {
      try {
         await api.post('/exam-violations/', payload);
      } catch (e) {
         await queueStore.setItem(`viol_${Date.now()}`, { type: 'violation', payload });
         updateQueueCount();
      }
    } else {
      await queueStore.setItem(`viol_${Date.now()}`, { type: 'violation', payload });
      updateQueueCount();
    }
  }, [attemptId, currentQuestionId, isOnline]);

  /**
   * Shared function to acquire media stream and wire up track listeners.
   * Used for both initial setup and in-place recovery.
   * Returns the stream on success, null on failure.
   */
  const acquireMediaStream = useCallback(async () => {
    try {
      // Stop any existing stream tracks first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: settings.camera_required,
        audio: settings.microphone_required
      });
      streamRef.current = stream;
      
      // Reset loss flags since we successfully acquired the stream
      hasLostCameraRef.current = false;
      hasLostMicRef.current = false;
      
      // Update camera state
      if (settings.camera_required) {
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
          setCameraActive(true);
        } else {
          setCameraActive(false);
        }
        // Attach video preview
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }
      
      // Update mic state
      if (settings.microphone_required) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
          setMicActive(true);
        } else {
          setMicActive(false);
        }
      }
      
      // Register track.onended listeners for disconnect detection
      stream.getTracks().forEach(track => {
        track.onended = () => {
          if (track.kind === 'video') {
             if (hasLostCameraRef.current) return; // Deduplicate logical event
             hasLostCameraRef.current = true;
             setCameraActive(false);
          }
          if (track.kind === 'audio') {
             if (hasLostMicRef.current) return; // Deduplicate logical event
             hasLostMicRef.current = true;
             setMicActive(false);
          }
          onPauseChange(true);
          logViolation(
            track.kind === 'video' ? 'CAMERA_OFF' : 'MICROPHONE_OFF', 
            'High', 
            'Hardware disconnected.'
          );
        };
      });

      return stream;
    } catch (err) {
      setCameraActive(false);
      setMicActive(false);
      return null;
    }
  }, [settings.camera_required, settings.microphone_required, onPauseChange, logViolation]);

  // Hardware Init — runs once on mount
  useEffect(() => {
    if (!settings.camera_required && !settings.microphone_required) return;
    if (initializedRef.current) return;
    
    const initHardware = async () => {
      const stream = await acquireMediaStream();
      initializedRef.current = true;
      if (stream) {
        onPauseChange(false);
      } else {
        onPauseChange(true);
      }
    };
    initHardware();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      clearInterval(snapshotIntervalRef.current);
    };
  }, [settings.camera_required, settings.microphone_required]);

  // Deterministic random question set calculation for 'random' mode
  const selectedRandomQuestions = React.useMemo(() => {
    if (settings.snapshot_mode !== 'random' || !totalQuestions) return new Set();
    const count = Math.min(settings.snapshot_interval || 5, totalQuestions);
    const set = new Set();
    let seed = ((attemptId || 1) * 2654435761) >>> 0;
    while (set.size < count) {
      seed = (seed ^ (seed << 13)) >>> 0;
      seed = (seed ^ (seed >> 17)) >>> 0;
      seed = (seed ^ (seed << 5)) >>> 0;
      const qNum = (seed % totalQuestions) + 1;
      set.add(qNum);
    }
    return set;
  }, [attemptId, totalQuestions, settings.snapshot_mode, settings.snapshot_interval]);

  // Snapshot Engine supporting 4 modes
  useEffect(() => {
    if (!settings.camera_required || !currentQuestionId) return;

    const currentQNum = (questionIndex !== undefined ? questionIndex + 1 : 1);
    const mode = settings.snapshot_mode || 'every_question';
    let shouldSnap = false;

    if (mode === 'every_question') {
      shouldSnap = true;
    } else if (mode === 'every_n_questions') {
      const n = settings.snapshot_interval || 5;
      shouldSnap = (currentQNum % n === 0);
    } else if (mode === 'random') {
      shouldSnap = selectedRandomQuestions.has(currentQNum);
    } else if (mode === 'custom') {
      const customNums = (settings.snapshot_custom_questions || '')
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));
      shouldSnap = customNums.includes(currentQNum);
    }

    if (!shouldSnap || snappedQuestionsRef.current.has(currentQuestionId)) {
      return;
    }

    const takeSnapshot = async () => {
      if (!videoRef.current || !cameraActive) return;
      snappedQuestionsRef.current.add(currentQuestionId);
      
      const canvas = canvasRef.current;
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const payload = new FormData();
        payload.append('attempt', attemptId);
        if (currentQuestionId) payload.append('question', currentQuestionId);
        payload.append('image', blob, 'snapshot.webp');

        if (isOnline) {
          try {
            await api.post('/exam-snapshots/', payload, { headers: { 'Content-Type': 'multipart/form-data' }});
          } catch(e) {
            // Queue on fail
            await queueStore.setItem(`snap_${Date.now()}`, { type: 'snapshot', blob, attemptId, questionId: currentQuestionId });
            updateQueueCount();
          }
        } else {
          await queueStore.setItem(`snap_${Date.now()}`, { type: 'snapshot', blob, attemptId, questionId: currentQuestionId });
          updateQueueCount();
        }
      }, 'image/webp', 0.5);
    };

    const t = setTimeout(takeSnapshot, 3000);
    return () => clearTimeout(t);
  }, [currentQuestionId, questionIndex, cameraActive, settings, isOnline, attemptId, selectedRandomQuestions]);




  useEffect(() => {
    let visibilityTimeout;
    let isHidden = false;
    
    const handleVisibility = () => {
      if (document.hidden) {
        if (visibilityTimeout) clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          isHidden = true;
          logViolation('TAB_HIDDEN', 'High', 'User hid the exam tab.');
        }, 500);
      } else {
        if (visibilityTimeout) clearTimeout(visibilityTimeout);
        if (isHidden) {
          logViolation('TAB_RETURNED', 'Low', 'User returned to the exam tab.');
          isHidden = false;
        }
      }
    };

    let blurTimeout;
    let isBlurred = false;
    
    const handleBlur = () => {
      if (blurTimeout) clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => {
        isBlurred = true;
        logViolation('WINDOW_BLUR', 'Medium', 'Exam window lost focus.');
      }, 500);
    };

    const handleFocus = () => {
      if (blurTimeout) clearTimeout(blurTimeout);
      if (isBlurred) {
        logViolation('WINDOW_FOCUS', 'Low', 'Exam window regained focus.');
        isBlurred = false;
      }
    };

    const handleFullscreenChange = () => {
      if (settings.fullscreen_required && !document.fullscreenElement) {
        logViolation('FULLSCREEN_EXIT', 'High', 'User exited fullscreen mode.');
      }
    };
    
    const handleCopy = (e) => {
      if (settings.copy_protection) {
        e.preventDefault();
        logViolation('COPY_ATTEMPT', 'Low', 'User attempted to copy text.');
        alert('Copying is disabled.');
      }
    };

    const handlePaste = (e) => {
      if (settings.copy_protection) {
        e.preventDefault();
        logViolation('PASTE_ATTEMPT', 'Low', 'User attempted to paste text.');
        alert('Pasting is disabled.');
      }
    };

    const handleContextMenu = (e) => {
      if (settings.copy_protection) {
        e.preventDefault();
        logViolation('RIGHT_CLICK', 'Low', 'User attempted right-click.');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [logViolation, settings.copy_protection, settings.fullscreen_required]);

  // Network Sync
  const updateQueueCount = async () => {
    const keys = await queueStore.keys();
    setQueueCount(keys.length);
    if (keys.length > 100) {
       // Purge oldest
       const sorted = keys.sort();
       await queueStore.removeItem(sorted[0]);
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const keys = await queueStore.keys();
      for (let k of keys) {
        const item = await queueStore.getItem(k);
        if (item.type === 'snapshot') {
          const payload = new FormData();
          payload.append('attempt', item.attemptId);
          if (item.questionId) payload.append('question', item.questionId);
          payload.append('image', item.blob, 'snapshot.webp');
          try {
            await api.post('/exam-snapshots/', payload, { headers: { 'Content-Type': 'multipart/form-data' }});
            await queueStore.removeItem(k);
          } catch(e) {}
        } else if (item.type === 'violation') {
          try {
             await api.post('/exam-violations/', item.payload);
             await queueStore.removeItem(k);
          } catch(e) {}
        }
      }
      updateQueueCount();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Propagate pause state whenever hardware status changes
  useEffect(() => {
    if (!settings.camera_required && !settings.microphone_required) return;
    const isMissing = (settings.camera_required && !cameraActive) || (settings.microphone_required && !micActive);
    onPauseChange(isMissing);
  }, [cameraActive, micActive, settings.camera_required, settings.microphone_required, onPauseChange]);

  /**
   * IN-PLACE RECOVERY: Re-acquire media stream without page reload.
   * Called when the student clicks "Restore Camera" / "Restore Microphone".
   */
  const handleRecoverHardware = async () => {
    setIsRecovering(true);
    try {
      const stream = await acquireMediaStream();
      if (stream) {
        // Verify both required devices are back
        let camOk = !settings.camera_required;
        let micOk = !settings.microphone_required;

        if (settings.camera_required) {
          const vt = stream.getVideoTracks();
          camOk = vt.length > 0 && vt[0].readyState === 'live';
          setCameraActive(camOk);
        }
        if (settings.microphone_required) {
          const at = stream.getAudioTracks();
          micOk = at.length > 0 && at[0].readyState === 'live';
          setMicActive(micOk);
        }

        if (camOk && micOk) {
          // Both ready — exam will auto-resume via the useEffect that watches cameraActive/micActive
          // onPauseChange(false) will be called by the effect above
        }
      }
    } catch (err) {
      // Failed to recover — state remains paused
    } finally {
      setIsRecovering(false);
    }
  };

  if (!isSupported) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <Alert type="danger" message="Your browser or device is not supported for this proctored exam. Please use Chrome or Edge on a desktop." />
      </div>
    );
  }

  const isHardwareMissing = (settings.camera_required && !cameraActive) || (settings.microphone_required && !micActive);

  // Build descriptive recovery message
  const getMissingDeviceMessage = () => {
    const missingCam = settings.camera_required && !cameraActive;
    const missingMic = settings.microphone_required && !micActive;
    if (missingCam && missingMic) return 'Camera and microphone access is required to continue.';
    if (missingCam) return 'Camera access is required to continue.';
    if (missingMic) return 'Microphone access is required to continue.';
    return '';
  };

  const getRecoverButtonLabel = () => {
    const missingCam = settings.camera_required && !cameraActive;
    const missingMic = settings.microphone_required && !micActive;
    if (isRecovering) return 'Reconnecting...';
    if (missingCam && missingMic) return 'Restore Camera & Microphone';
    if (missingCam) return 'Restore Camera';
    if (missingMic) return 'Restore Microphone';
    return 'Restore Devices';
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Proctoring HUD */}
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999, display: 'flex', gap: '10px', flexDirection: 'column' }}>
        {settings.camera_required && (
          <div style={{ width: '150px', height: '100px', backgroundColor: '#000', borderRadius: '4px', overflow: 'hidden', border: cameraActive ? '2px solid var(--color-success)' : '2px solid var(--color-danger)', boxShadow: 'var(--shadow-sm)' }}>
             <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
          </div>
        )}
        <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-main)' }}>
          <div style={{ marginBottom: '4px' }}>🌐 Network: <strong style={{ color: isOnline ? 'var(--color-success)' : 'var(--color-danger)' }}>{isOnline ? 'Online' : 'Offline'}</strong></div>
          {queueCount > 0 && <div style={{ color: 'var(--color-warning)', marginBottom: '4px' }}>Pending Syncs: {queueCount}</div>}
          {settings.microphone_required && <div style={{ marginBottom: '4px' }}>🎤 Mic: <strong style={{ color: micActive ? 'var(--color-success)' : 'var(--color-danger)' }}>{micActive ? 'Active' : 'Lost'}</strong></div>}
          {settings.max_warnings > 0 && <div>⚠️ Warnings: {warnings} / {settings.max_warnings}</div>}
        </div>
      </div>

      {isHardwareMissing ? (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 9998, 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          color: 'white', flexDirection: 'column', padding: '20px', textAlign: 'center' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            padding: '40px', 
            maxWidth: '480px', 
            width: '100%',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
            color: 'var(--color-text-main)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', fontWeight: 700, color: 'var(--color-danger)' }}>Exam Paused</h2>
            <p style={{ margin: '0 0 8px', fontSize: '1rem', opacity: 0.9, lineHeight: 1.6 }}>
              {getMissingDeviceMessage()}
            </p>
            <p style={{ margin: '0 0 28px', fontSize: '0.85rem', opacity: 0.6, lineHeight: 1.5 }}>
              Your progress and answers are preserved. The timer is paused.
              Please reconnect your device or grant permission, then click the button below.
            </p>
            <Button 
              onClick={handleRecoverHardware} 
              disabled={isRecovering}
              style={{ 
                fontSize: '1.05rem', 
                padding: '14px 32px',
                width: '100%',
                maxWidth: '320px'
              }}
            >
              {getRecoverButtonLabel()}
            </Button>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
};
