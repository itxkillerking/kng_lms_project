import React from 'react';
import { Card } from '../../components/common/UIComponents';

const Placeholder = ({ title }) => (
  <Card style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
    <h2>{title}</h2>
    <p style={{ color: 'var(--color-text-muted)' }}>This feature is coming soon in future updates.</p>
  </Card>
);

export const ResultsPlaceholder = () => <Placeholder title="Exam Results" />;
export const ViolationsPlaceholder = () => <Placeholder title="Violation Logs" />;
export const SnapshotsPlaceholder = () => <Placeholder title="Proctoring Snapshots" />;
export const ReportsPlaceholder = () => <Placeholder title="Analytics & Reports" />;
