import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button, Alert } from '../../components/common/UIComponents';

// CODE EDITOR COMPONENT
export const CodeQuestionEditor = ({ value, onChange, language, starterCode, disabled }) => {
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  
  // Initialize with starter code if empty
  useEffect(() => {
    if (!value && starterCode) {
      onChange(starterCode);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ padding: '8px', backgroundColor: '#1e1e1e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ padding: '4px', borderRadius: '4px', background: '#333', color: 'white', border: 'none' }}>
            <option value="vs-dark">Dark Theme</option>
            <option value="light">Light Theme</option>
          </select>
          <select value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} style={{ padding: '4px', borderRadius: '4px', background: '#333', color: 'white', border: 'none' }}>
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
          </select>
        </div>
        <div>
          Language: <strong>{language || 'javascript'}</strong>
        </div>
      </div>
      <Editor
        height="100%"
        language={language || 'javascript'}
        theme={theme}
        value={value}
        onChange={(val) => onChange(val)}
        options={{
          fontSize: fontSize,
          minimap: { enabled: false },
          lineNumbers: 'on',
          readOnly: disabled,
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
      />
    </div>
  );
};

// AUDIO EDITOR COMPONENT
export const AudioQuestionEditor = ({ 
  audioBlob, 
  onSaveAudio, 
  transcriptText, 
  onTranscriptChange, 
  transcriptEnabled,
  maxRecordingSeconds,
  disabled 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micError, setMicError] = useState('');
  const [audioUrl, setAudioUrl] = useState(audioBlob ? URL.createObjectURL(audioBlob) : null);
  const [transcriptStatus, setTranscriptStatus] = useState('waiting');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (audioBlob) {
      setAudioUrl(URL.createObjectURL(audioBlob));
      setTranscriptStatus('processing');
      // Simulate processing
      setTimeout(() => setTranscriptStatus('ready'), 3000);
    }
  }, [audioBlob]);

  useEffect(() => {
    if (isRecording && maxRecordingSeconds > 0 && recordingTime >= maxRecordingSeconds) {
      stopRecording();
    }
  }, [recordingTime, isRecording, maxRecordingSeconds]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Check size
        if (blob.size > 10 * 1024 * 1024) {
           setMicError('Recording exceeded 10MB upload limit. Please record a shorter message.');
           return;
        }
        setAudioUrl(URL.createObjectURL(blob));
        onSaveAudio(blob);
        setTranscriptStatus('processing');
        setTimeout(() => setTranscriptStatus('ready'), 3000); // simulated wait
      };

      mediaRecorder.start();
      setIsRecording(true);
      setMicError('');
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setMicError('Microphone access denied. You can manually type your answer below.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const deleteRecording = () => {
    if (window.confirm("Delete this recording?")) {
      setAudioUrl(null);
      onSaveAudio(null);
      setTranscriptStatus('waiting');
      onTranscriptChange('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      {micError && <Alert type="warning" message={micError} />}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', backgroundColor: '#FAFAFA', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        {!audioUrl ? (
          <>
            {!isRecording ? (
              <Button onClick={startRecording} disabled={disabled} style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                🎤 Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} style={{ backgroundColor: '#1e293b' }}>
                ⏹ Stop Recording
              </Button>
            )}
            {isRecording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)', fontWeight: 'bold' }}>
                <span className="recording-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', display: 'inline-block' }}></span>
                {recordingTime}s {maxRecordingSeconds ? `/ ${maxRecordingSeconds}s` : ''}
              </div>
            )}
          </>
        ) : (
          <>
            <audio src={audioUrl} controls style={{ height: '40px' }} />
            <Button variant="danger" onClick={deleteRecording} disabled={disabled}>🗑 Delete</Button>
          </>
        )}
      </div>

      {transcriptEnabled && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
            <strong>Transcript / Text Answer</strong>
            <span style={{ fontSize: 'var(--font-size-sm)', color: transcriptStatus === 'ready' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
              Status: {transcriptStatus}
            </span>
          </div>
          <textarea 
            style={{ width: '100%', minHeight: '120px', padding: 'var(--spacing-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            value={transcriptText || ''}
            onChange={(e) => onTranscriptChange(e.target.value)}
            disabled={disabled}
            placeholder={micError ? 'Type your answer here manually...' : 'Transcript will appear here or you can type manually...'}
          />
        </div>
      )}
    </div>
  );
};
