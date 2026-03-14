import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { Award, Download, Loader } from 'lucide-react';
import api from '../../services/api';

const Certificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const response = await api.get('certificates/');
                setCertificates(Array.isArray(response.data) ? response.data : response.data.results || []);
            } catch (error) {
                console.error("Error fetching certificates:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCertificates();
    }, []);

    const handleDownload = async (id, courseTitle) => {
        setDownloadingId(id);
        try {
            const response = await api.get(`certificates/${id}/download/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Certificate_${courseTitle.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error downloading certificate:", error);
            alert("Failed to download certificate. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading your certificates...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                <Award size={40} color="var(--accent-blue)" />
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 600 }}>My Certificates</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Your earned credentials and achievements.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {certificates.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
                        <Award size={64} style={{ opacity: 0.3, marginBottom: '16px', margin: '0 auto' }} />
                        <h3 style={{ color: 'var(--text-secondary)' }}>No certificates yet.</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Complete courses to earn certificates.</p>
                    </div>
                ) : (
                    certificates.map(cert => (
                        <GlassCard key={cert.id} style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                            <div style={{ background: 'linear-gradient(135deg, var(--accent-blue-transparent), var(--accent-purple-transparent))', padding: '40px', textAlign: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                                <Award size={64} color="var(--accent-blue)" style={{ filter: 'drop-shadow(0 0 10px rgba(10, 132, 255, 0.5))', margin: '0 auto' }} />
                            </div>
                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>{cert.course_title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                                    Issued: {new Date(cert.issue_date).toLocaleDateString()}
                                </p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '24px', fontFamily: 'monospace' }}>
                                    ID: {cert.certificate_id}
                                </p>
                                <div style={{ marginTop: 'auto' }}>
                                    <GlassButton 
                                        className="primary" 
                                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                                        onClick={() => handleDownload(cert.id, cert.course_title)}
                                        disabled={downloadingId === cert.id}
                                    >
                                        {downloadingId === cert.id ? (
                                            <>
                                                <Loader size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={18} /> Download PDF
                                            </>
                                        )}
                                    </GlassButton>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    );
};

export default Certificates;
