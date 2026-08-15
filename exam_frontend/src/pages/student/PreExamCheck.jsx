import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Alert } from '../../components/common/UIComponents';
import './preexamcheck.css';

/**
 * Phase 8.1: Pre-Exam Camera & Microphone Check
 * 
 * This component gates the exam start flow. The student cannot proceed
 * to the actual exam until both camera and microphone are verified working.
 * 
 * Props:
 *   onReady(stream)  — called when both devices are confirmed. Passes the MediaStream.
 *   onCancel()       — called when the student cancels / goes back.
 *   examTitle        — the exam title for display context.
 */

const STATUS = {
  CHECKING: 'checking',
  PERMISSION_REQUIRED: 'permission_required',
  READY: 'ready',
  CAMERA_ERROR: 'camera_error',
  MICROPHONE_ERROR: 'microphone_error',
  DEVICE_ERROR: 'device_error',
  UNSUPPORTED: 'unsupported',
};

export const PreExamCheck = ({ onReady, onCancel, examTitle }) => {
  const [status, setStatus] = useState(STATUS.CHECKING);
  const [errorDetail, setErrorDetail] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const checkDevices = useCallback(async () => {
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus(STATUS.UNSUPPORTED);
      setErrorDetail('Your browser does not support camera/microphone access. Please use Chrome or Edge on a desktop computer.');
      return;
    }

    // Check HTTPS (required for getUserMedia in production)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setStatus(STATUS.UNSUPPORTED);
      setErrorDetail('Camera and microphone access requires a secure (HTTPS) connection.');
      return;
    }

    setStatus(STATUS.CHECKING);
    setCameraReady(false);
    setMicReady(false);
    setErrorDetail('');

    try {
      // Clean up any previous stream
      cleanupStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      streamRef.current = stream;

      // Verify we got both tracks
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      if (videoTracks.length === 0) {
        setStatus(STATUS.CAMERA_ERROR);
        setErrorDetail('No camera track was received. Please ensure your camera is connected and not in use by another application.');
        return;
      }

      if (audioTracks.length === 0) {
        setStatus(STATUS.MICROPHONE_ERROR);
        setErrorDetail('No microphone track was received. Please ensure your microphone is connected and not in use by another application.');
        return;
      }

      // Check track states
      if (videoTracks[0].readyState !== 'live') {
        setStatus(STATUS.CAMERA_ERROR);
        setErrorDetail('Camera track is not active. Please check your camera connection.');
        return;
      }

      if (audioTracks[0].readyState !== 'live') {
        setStatus(STATUS.MICROPHONE_ERROR);
        setErrorDetail('Microphone track is not active. Please check your microphone connection.');
        return;
      }

      // Attach video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setCameraReady(true);
      setMicReady(true);
      setStatus(STATUS.READY);

    } catch (err) {
      handleMediaError(err);
    } finally {
      setRetrying(false);
    }
  }, [cleanupStream]);

  const handleMediaError = (err) => {
    const name = err.name || '';
    const message = err.message || '';

    switch (name) {
      case 'NotAllowedError':
        // User denied permission — figure out which
        if (message.toLowerCase().includes('audio') || message.toLowerCase().includes('microphone')) {
          setStatus(STATUS.MICROPHONE_ERROR);
          setErrorDetail('Microphone permission was denied. Please allow microphone access in your browser settings and try again.');
        } else if (message.toLowerCase().includes('video') || message.toLowerCase().includes('camera')) {
          setStatus(STATUS.CAMERA_ERROR);
          setErrorDetail('Camera permission was denied. Please allow camera access in your browser settings and try again.');
        } else {
          setStatus(STATUS.DEVICE_ERROR);
          setErrorDetail('Camera and microphone permissions were denied. Please allow access in your browser settings and try again.');
        }
        break;

      case 'NotFoundError':
        setStatus(STATUS.DEVICE_ERROR);
        setErrorDetail('No camera or microphone was found. Please connect a camera and microphone and try again.');
        break;

      case 'NotReadableError':
        setStatus(STATUS.DEVICE_ERROR);
        setErrorDetail('Your camera or microphone is already in use by another application. Please close other apps using the camera/microphone and try again.');
        break;

      case 'OverconstrainedError':
        setStatus(STATUS.DEVICE_ERROR);
        setErrorDetail('Your camera or microphone does not meet the required constraints. Please try a different device.');
        break;

      case 'SecurityError':
        setStatus(STATUS.UNSUPPORTED);
        setErrorDetail('Camera and microphone access was blocked by your browser security settings. Please ensure you are using HTTPS.');
        break;

      case 'AbortError':
        setStatus(STATUS.DEVICE_ERROR);
        setErrorDetail('The camera/microphone request was interrupted. Please try again.');
        break;

      default:
        setStatus(STATUS.DEVICE_ERROR);
        setErrorDetail(`An unexpected error occurred: ${message || name || 'Unknown error'}. Please try again or use a different browser.`);
    }
  };

  // Initial check on mount
  useEffect(() => {
    checkDevices();

    return () => {
      // Only cleanup if we're not passing the stream to the exam
      // The parent component will handle cleanup when it receives the stream
    };
  }, [checkDevices]);

  const isReadyRef = useRef(false);
  useEffect(() => {
    isReadyRef.current = status === STATUS.READY;
  }, [status]);

  // Cleanup on unmount if not READY (user cancelled)
  useEffect(() => {
    return () => {
      if (!isReadyRef.current) {
        cleanupStream();
      }
    };
  }, [cleanupStream]);

  const handleRetry = () => {
    setRetrying(true);
    cleanupStream();
    // Small delay to allow browser to release device handles
    setTimeout(() => checkDevices(), 500);
  };

  const handleStartExam = () => {
    if (status === STATUS.READY && streamRef.current) {
      onReady(streamRef.current);
    }
  };

  const handleCancel = () => {
    cleanupStream();
    onCancel();
  };

  return (
    <div className="preexam-container">
      <div className="preexam-card glass-panel-strong">
        <div className="preexam-header">
          <div className="preexam-icon">🔒</div>
          <h2>Proctoring Setup</h2>
          {examTitle && <p className="preexam-subtitle">{examTitle}</p>}
        </div>

        <div className="preexam-body">
          <p className="preexam-description">
            This exam requires camera and microphone access for proctoring.
            Both devices must be working before you can start.
          </p>

          {/* Device Status Indicators */}
          <div className="device-status-grid">
            <div className={`device-status-item ${cameraReady ? 'ready' : status === STATUS.CAMERA_ERROR ? 'error' : 'pending'}`}>
              <div className="device-icon">📷</div>
              <div className="device-info">
                <span className="device-label">Camera</span>
                <span className="device-state">
                  {status === STATUS.CHECKING ? 'Checking...' :
                   cameraReady ? '✓ Connected' :
                   status === STATUS.CAMERA_ERROR ? '✕ Error' :
                   status === STATUS.UNSUPPORTED ? '✕ Unsupported' :
                   '○ Waiting'}
                </span>
              </div>
            </div>

            <div className={`device-status-item ${micReady ? 'ready' : status === STATUS.MICROPHONE_ERROR ? 'error' : 'pending'}`}>
              <div className="device-icon">🎤</div>
              <div className="device-info">
                <span className="device-label">Microphone</span>
                <span className="device-state">
                  {status === STATUS.CHECKING ? 'Checking...' :
                   micReady ? '✓ Connected' :
                   status === STATUS.MICROPHONE_ERROR ? '✕ Error' :
                   status === STATUS.UNSUPPORTED ? '✕ Unsupported' :
                   '○ Waiting'}
                </span>
              </div>
            </div>
          </div>

          {/* Camera Preview */}
          {(status === STATUS.READY || status === STATUS.CHECKING) && (
            <div className="preexam-preview-container">
              <video
                ref={videoRef}
                className="preexam-video-preview"
                autoPlay
                playsInline
                muted
              />
              {status === STATUS.CHECKING && (
                <div className="preview-overlay">
                  <div className="checking-spinner"></div>
                  <span>Initializing camera...</span>
                </div>
              )}
            </div>
          )}

          {/* Status Messages */}
          {status === STATUS.CHECKING && (
            <div className="preexam-status-msg checking">
              <div className="checking-spinner"></div>
              <span>Checking camera and microphone...</span>
            </div>
          )}

          {status === STATUS.READY && (
            <Alert type="success" message="Camera and microphone are ready. You may start the exam." />
          )}

          {(status === STATUS.CAMERA_ERROR || status === STATUS.MICROPHONE_ERROR || status === STATUS.DEVICE_ERROR || status === STATUS.UNSUPPORTED) && (
            <Alert type="error" message={errorDetail} />
          )}
        </div>

        {/* Actions */}
        <div className="preexam-actions">
          <Button variant="secondary" onClick={handleCancel}>
            ← Back
          </Button>

          {status === STATUS.READY ? (
            <Button onClick={handleStartExam} style={{ fontSize: '1.1rem', padding: '12px 32px' }}>
              Start Exam
            </Button>
          ) : status !== STATUS.CHECKING ? (
            <Button onClick={handleRetry} disabled={retrying}>
              {retrying ? 'Retrying...' : 'Retry Permission Check'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
