import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, Button, LoadingOverlay, Alert } from '../../components/common/UIComponents';

export const AttemptReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [securityData, setSecurityData] = useState(null);
  const [filter, setFilter] = useState('All');
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const attemptRes = await api.get(`/exam-attempts/${id}/`);
        setAttempt(attemptRes.data);
        
        const secRes = await api.get(`/exam-attempts/${id}/security_summary/`);
        setSecurityData(secRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <LoadingOverlay message="Loading Security Review..." />;
  if (!attempt || !securityData) return <Alert type="error" message="Failed to load attempt details." />;

  // Combine and sort timeline
  let timeline = [
    ...(securityData.violations || []).map(v => ({ ...v, itemType: 'violation', time: new Date(v.timestamp).getTime() })),
    ...(securityData.snapshots || []).map(s => ({ ...s, itemType: 'snapshot', time: new Date(s.captured_at).getTime() }))
  ];
  
  timeline.sort((a, b) => b.time - a.time); // Newest first
  
  // Filter
  if (filter !== 'All') {
    if (filter === 'Snapshots') {
      timeline = timeline.filter(item => item.itemType === 'snapshot');
    } else {
      timeline = timeline.filter(item => item.itemType === 'violation' && item.violation_type === filter);
    }
  }

  const getSeverityColor = (sev) => {
    if (sev === 'High') return 'var(--color-danger)';
    if (sev === 'Medium') return 'orange';
    return 'var(--color-success)';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2>Security Review: {attempt.student?.username || 'Student'}</h2>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
          <h3 style={{ fontSize: '24px', color: 'var(--color-danger)' }}>{securityData.total_violations}</h3>
          <p>Total Violations</p>
        </Card>
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
          <h3 style={{ fontSize: '24px', color: 'var(--color-primary)' }}>{securityData.total_snapshots}</h3>
          <p>Total Snapshots</p>
        </Card>
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
          <h3 style={{ fontSize: '24px', color: getSeverityColor(securityData.highest_severity) }}>{securityData.highest_severity || 'None'}</h3>
          <p>Highest Severity</p>
        </Card>
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
          <h3 style={{ fontSize: '24px', color: 'orange' }}>{securityData.warning_count}</h3>
          <p>Warnings Issued</p>
        </Card>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-6)' }}>
        <h3>Violation Breakdown</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap', marginTop: 'var(--spacing-4)' }}>
          {Object.entries(securityData.counts_by_type || {}).map(([type, count]) => (
            <div key={type} style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '14px' }}>
              <strong>{type}:</strong> {count}
            </div>
          ))}
          {Object.keys(securityData.counts_by_type || {}).length === 0 && <span style={{ color: 'var(--color-success)' }}>No violations recorded.</span>}
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
          <h3>Security Timeline</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
            <option value="All">All Events</option>
            <option value="Snapshots">Snapshots Only</option>
            <option value="CAMERA_OFF">Camera Off</option>
            <option value="MICROPHONE_OFF">Microphone Off</option>
            <option value="TAB_SWITCH">Tab Switches</option>
            <option value="COPY_ATTEMPT">Copy Attempts</option>
            <option value="PASTE_ATTEMPT">Paste Attempts</option>
            <option value="FULLSCREEN_EXIT">Fullscreen Exits</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {timeline.length === 0 ? <p>No events match this filter.</p> : (
            timeline.map(item => (
              <div key={`${item.itemType}_${item.id}`} style={{ padding: '16px', borderLeft: `4px solid ${item.itemType === 'snapshot' ? 'var(--color-primary)' : getSeverityColor(item.severity)}`, backgroundColor: '#fafafa', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>
                    {item.itemType === 'snapshot' ? '📸 Snapshot Taken' : `🚨 Violation: ${item.violation_type}`}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'gray' }}>{new Date(item.time).toLocaleString()}</span>
                </div>
                
                {item.itemType === 'snapshot' ? (
                  <div>
                    {item.question && <p style={{ fontSize: '13px', marginBottom: '8px' }}>Question ID: {item.question}</p>}
                    <img src={item.image_url} alt="Snapshot" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px', border: '1px solid #ddd' }} />
                  </div>
                ) : (
                  <div>
                    {item.question && <p style={{ fontSize: '13px', marginBottom: '4px' }}>Question ID: {item.question}</p>}
                    <p style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>{item.details || 'No details provided.'}</p>
                    <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', backgroundColor: getSeverityColor(item.severity), color: 'white' }}>
                      Severity: {item.severity}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
