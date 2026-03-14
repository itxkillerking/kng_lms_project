import React from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { 
    X, 
    User, 
    Mail, 
    Shield, 
    Calendar, 
    Star, 
    Edit, 
    BadgeCheck,
    Briefcase,
    Globe,
    Fingerprint,
    Phone,
    Info,
    Activity,
    LogOut,
    Lock,
    AtSign,
    Zap,
    Hash
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const ProfileInspector = ({ user, onClose }) => {
    const { logout } = useAuth();
    
    if (!user) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 2, 5, 0.85)',
            backdropFilter: 'blur(40px) saturate(180%)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            animation: 'inspectorFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }} onClick={onClose}>
            <GlassCard heavy style={{ 
                width: '100%',
                maxWidth: '900px',
                height: 'auto',
                minHeight: '580px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden',
                position: 'relative',
                padding: '0',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 60px 120px -20px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                borderRadius: '48px',
                background: 'rgba(10, 11, 20, 0.6)'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Left Panel: High-Impact Branding */}
                <div style={{ 
                    flex: '0 0 380px', 
                    background: 'linear-gradient(165deg, rgba(10, 132, 255, 0.15) 0%, rgba(191, 90, 242, 0.15) 100%)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '60px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Floating Decorative Elements */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03, pointerEvents: 'none' }}>
                        <Zap size={400} style={{ position: 'absolute', top: '-100px', left: '-100px' }} />
                    </div>
                    
                    <div style={{ 
                        width: '160px', 
                        height: '160px', 
                        borderRadius: '48px', 
                        background: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '4.5rem',
                        fontWeight: 900,
                        boxShadow: '0 30px 60px rgba(10, 132, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.2)',
                        border: '6px solid rgba(255, 255, 255, 0.12)',
                        marginBottom: '40px',
                        zIndex: 2
                    }}>
                        {user.username[0].toUpperCase()}
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(10, 132, 255, 0.15)',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            color: '#0A84FF',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            border: '1px solid rgba(10, 132, 255, 0.2)',
                            marginBottom: '20px'
                        }}>
                            <BadgeCheck size={14} /> System Administrator
                        </div>
                        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'white', marginBottom: '8px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                            {user.first_name || user.username}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '1.1rem' }}>
                            <AtSign size={16} /> {user.username}
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', width: '100%', padding: '0 20px' }}>
                        <GlassButton onClick={logout} style={{ width: '100%', py: '16px', background: 'rgba(255, 69, 58, 0.1)', color: '#ff453a', border: '1px solid rgba(255, 69, 58, 0.2)', borderRadius: '18px' }}>
                            <LogOut size={18} style={{ marginRight: '10px' }} /> End Admin Session
                        </GlassButton>
                    </div>
                </div>

                {/* Right Panel: Content Grid */}
                <div style={{ 
                    flex: 1, 
                    padding: '60px 50px', 
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(0, 0, 0, 0.1)',
                    overflowY: 'auto'
                }} className="custom-inspector-scroll">
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '6px' }}>Master Profile</h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.95rem' }}>Global administrative credentials and platform status.</p>
                        </div>
                        <button 
                            onClick={onClose}
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.04)', 
                                border: '1px solid rgba(255, 255, 255, 0.08)', 
                                color: 'white', 
                                cursor: 'pointer', 
                                width: '48px', 
                                height: '48px', 
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }}>
                        
                        {/* Security Row */}
                        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '10px' }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <Shield size={20} color="#0A84FF" style={{ marginBottom: '12px' }} />
                                <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.3)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Level</p>
                                <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Super Root</p>
                            </div>
                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <Activity size={20} color="#10b981" style={{ marginBottom: '12px' }} />
                                <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.3)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Status</p>
                                <p style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>Operational</p>
                            </div>
                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <Hash size={20} color="#BF5AF2" style={{ marginBottom: '12px' }} />
                                <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.3)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>System ID</p>
                                <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>#{user.id}</p>
                            </div>
                        </div>

                        {/* Details Sections */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div>
                                <h4 style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>Network Identity</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <Mail size={18} color="rgba(255, 255, 255, 0.3)" />
                                        <div style={{ color: 'white', fontWeight: 600, fontSize: '1rem', wordBreak: 'break-all' }}>{user.email}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <Phone size={18} color="rgba(255, 255, 255, 0.3)" />
                                        <div style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>{user.phone_number || 'Mobile Unverified'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div>
                                <h4 style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>System Tenure</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <Calendar size={18} color="rgba(255, 255, 255, 0.3)" />
                                        <div>
                                            <p style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>{new Date(user.joined_at || user.date_joined).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.3)' }}>Established Admin Registry</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {user.bio && (
                            <div style={{ gridColumn: 'span 2', background: 'rgba(255, 255, 255, 0.02)', padding: '30px', borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: 'rgba(255, 255, 255, 0.2)' }}>
                                    <Info size={18} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Registry Bio-Data</span>
                                </div>
                                <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.8, fontSize: '1.05rem', fontStyle: 'italic' }}>"{user.bio}"</p>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '60px', display: 'flex', gap: '20px' }}>
                        <GlassButton wide style={{ py: '20px', borderRadius: '24px', fontSize: '1.05rem', boxShadow: '0 20px 40px rgba(10, 132, 255, 0.2)' }}>
                            <Edit size={22} style={{ marginRight: '12px' }} /> Update Control Data
                        </GlassButton>
                        <GlassButton onClick={onClose} style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', py: '20px', borderRadius: '24px', px: '40px' }}>
                            Dismiss
                        </GlassButton>
                    </div>
                </div>
            </GlassCard>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes inspectorFadeIn {
                    from { opacity: 0; transform: translateY(40px) scale(0.92); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .custom-inspector-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-inspector-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-inspector-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                }
                .custom-inspector-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}} />
        </div>
    );
};
