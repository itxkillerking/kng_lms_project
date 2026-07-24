import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { User as UserIcon, Mail, Phone, Calendar, Edit3, Save, X, Camera, Shield, ZoomIn, ZoomOut, Check, Globe, Linkedin } from 'lucide-react';
import api from '../../../services/api';
import Cropper from 'react-easy-crop';
import { getCroppedImgBlob } from '../../../utils/cropImage';

const Profile = () => {
    const { user, login } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Window width handling for responsiveness
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isExtraSmall = windowWidth <= 480;
    const isMobile = windowWidth <= 768;
    const isTablet = windowWidth <= 1100;

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        phone_number: '',
        instructor_title: '',
        experience: '',
        website_url: '',
        linkedin_url: ''
    });

    // Image Crop State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    
    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                bio: user.bio || '',
                phone_number: user.phone_number || '',
                email: user.email || '',
                instructor_title: user.instructor_title || '',
                experience: user.experience || '',
                website_url: user.website_url || '',
                linkedin_url: user.linkedin_url || ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.patch('users/me/', formData);
            setIsEditing(false);
            window.location.reload(); 
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result);
                setShowCropModal(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const applyCropAndUpload = async () => {
        try {
            setLoading(true);
            const croppedBlob = await getCroppedImgBlob(imageSrc, croppedAreaPixels);
            const uploadData = new FormData();
            uploadData.append('profile_picture', croppedBlob, 'profile.jpg');
            
            await api.patch('users/me/', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            window.location.reload();
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image.");
        } finally {
            setLoading(false);
            setShowCropModal(false);
            setImageSrc(null);
        }
    };

    // Helper for splitting Experience / Bio texts elegantly into stylistic cards
    const renderTextBlocks = (text) => {
        if (!text) return <p style={{ fontSize: '1.05rem', color: '#64748b', fontStyle: 'italic' }}>Not provided.</p>;
        
        const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
        if (paragraphs.length === 0) return <p style={{ fontSize: '1.05rem', color: '#64748b', fontStyle: 'italic' }}>Not provided.</p>;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {paragraphs.map((para, idx) => (
                    <div key={idx} style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                        borderRadius: '20px',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        borderLeft: '4px solid #0A84FF',
                    }}>
                        <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 500 }}>
                            {para}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    if (!user) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', color: '#1a1a2e' }}>Loading Profile...</div>;

    const initials = `${user.first_name?.[0] || user.username[0]}${user.last_name?.[0] || ''}`.toUpperCase();

    return (
        <div className="animate-fade-in" style={{ padding: isExtraSmall ? '40px 16px' : isMobile ? '40px 24px' : '40px 40px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px', textAlign: isTablet ? 'center' : 'left' }}>
                <h1 style={{ fontSize: isExtraSmall ? '2rem' : '2.5rem', fontWeight: 800, marginBottom: '8px', color: '#1a1a2e', letterSpacing: '-0.03em' }}>Your Profile</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your personal information and preferences.</p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isTablet ? '1fr' : '1fr 2.5fr', 
                gap: isMobile ? '24px' : '40px',
                alignItems: 'start'
            }}>
                {/* Profile Stats / Avatar Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: isTablet ? 'static' : 'sticky', top: '40px' }}>
                    <GlassCard heavy style={{ padding: isExtraSmall ? '24px' : '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: isExtraSmall ? '120px' : '140px', height: isExtraSmall ? '120px' : '140px', margin: '0 auto 24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                            {user.profile_picture ? (
                                <img src={user.profile_picture.startsWith('http') ? user.profile_picture : `${import.meta.env.VITE_API_BASE_URL}${user.profile_picture}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#1a1a2e' }}>{initials}</span>
                            )}
                            <input 
                                type="file" 
                                id="profile-upload" 
                                hidden 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <div 
                                onClick={() => document.getElementById('profile-upload').click()}
                                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: isEditing ? 1 : 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                onMouseEnter={e => !isEditing && (e.currentTarget.style.opacity = 1)}
                                onMouseLeave={e => !isEditing && (e.currentTarget.style.opacity = 0)}
                            >
                                <Camera size={28} color="white" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>{user.first_name} {user.last_name}</h2>
                        <p style={{ color: '#0A84FF', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px' }}>{user.role}</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', marginTop: '16px', padding: '20px', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '20px', width: '100%', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                                <Shield size={16} color="#0A84FF" /> <span>Verified {user.role === 'instructor' ? 'Instructor' : 'Student'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                                <Calendar size={16} color="#0A84FF" /> <span>Joined {new Date(user.joined_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Information Layout Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <GlassCard heavy style={{ padding: isExtraSmall ? '24px' : isMobile ? '32px' : '48px', borderRadius: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: isExtraSmall ? 'column' : 'row', justifyContent: 'space-between', alignItems: isExtraSmall ? 'flex-start' : 'center', marginBottom: '36px', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Personal Information</h3>
                            {!isEditing ? (
                                <GlassButton onClick={() => setIsEditing(true)} style={{ gap: '8px', fontSize: '0.9rem', padding: '12px 24px', borderRadius: '16px', width: isExtraSmall ? '100%' : 'auto', justifyContent: 'center' }}>
                                    <Edit3 size={16} /> Edit Profile
                                </GlassButton>
                            ) : (
                                <div style={{ display: 'flex', gap: '12px', width: isExtraSmall ? '100%' : 'auto' }}>
                                    <GlassButton onClick={() => setIsEditing(false)} style={{ flex: isExtraSmall ? 1 : 'none', gap: '8px', fontSize: '0.9rem', background: 'rgba(255,69,58,0.05)', color: '#ff453a', borderColor: 'rgba(255,69,58,0.1)', borderRadius: '16px', justifyContent: 'center' }}>
                                        <X size={16} /> Cancel
                                    </GlassButton>
                                    <GlassButton onClick={handleSave} className="primary" disabled={loading} style={{ flex: isExtraSmall ? 1 : 'none', gap: '8px', fontSize: '0.9rem', borderRadius: '16px', justifyContent: 'center', background: '#0A84FF' }}>
                                        <Save size={16} /> {loading ? 'Saving...' : 'Save'}
                                    </GlassButton>
                                </div>
                            )}
                        </div>

                        {/* Top Info Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>First Name</label>
                                {isEditing ? (
                                    <input className="glass-input" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={{ background: 'rgba(0, 0, 0, 0.03)' }} />
                                ) : (
                                    <p style={{ fontSize: '1.15rem', fontWeight: 600, padding: '4px 0' }}>{user.first_name || 'Not provided'}</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Last Name</label>
                                {isEditing ? (
                                    <input className="glass-input" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={{ background: 'rgba(0, 0, 0, 0.03)' }} />
                                ) : (
                                    <p style={{ fontSize: '1.15rem', fontWeight: 600, padding: '4px 0' }}>{user.last_name || 'Not provided'}</p>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px', marginTop: '32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Email Address</label>
                                {isEditing ? (
                                    <input className="glass-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ background: 'rgba(0, 0, 0, 0.03)' }} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 500, padding: '4px 0' }}>
                                        <div style={{ background: 'rgba(10, 132, 255, 0.1)', padding: '6px', borderRadius: '8px' }}>
                                            <Mail size={16} color="#0A84FF" />
                                        </div>
                                        {user.email}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Phone Number</label>
                                {isEditing ? (
                                    <input className="glass-input" placeholder="+1 (555) 000-0000" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} style={{ background: 'rgba(0, 0, 0, 0.03)' }} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 500, padding: '4px 0' }}>
                                        <div style={{ background: 'rgba(10, 132, 255, 0.1)', padding: '6px', borderRadius: '8px' }}>
                                            <Phone size={16} color="#0A84FF" />
                                        </div>
                                        {user.phone_number || <span style={{ color: '#94a3b8' }}>No phone number added</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Social Links Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px', marginTop: '32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Website Portfolio URL</label>
                                {isEditing ? (
                                    <input className="glass-input" placeholder="https://example.com" value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} style={{ background: 'rgba(0, 0, 0, 0.03)' }} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 500, padding: '4px 0' }}>
                                        <div style={{ background: 'rgba(10, 132, 255, 0.1)', padding: '6px', borderRadius: '8px' }}>
                                            <Globe size={16} color="#0A84FF" />
                                        </div>
                                        {user.website_url ? <a href={user.website_url} target="_blank" rel="noreferrer" style={{ color: '#1a1a2e', textDecoration: 'none', borderBottom: '1px solid #0A84FF' }}>Visit Website</a> : <span style={{ color: '#94a3b8' }}>No link added</span>}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>LinkedIn Profile URL</label>
                                {isEditing ? (
                                    <input className="glass-input" placeholder="https://linkedin.com/in/username" value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} style={{ background: 'rgba(0, 0, 0, 0.03)' }} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 500, padding: '4px 0' }}>
                                        <div style={{ background: 'rgba(10, 132, 255, 0.1)', padding: '6px', borderRadius: '8px' }}>
                                            <Linkedin size={16} color="#0A84FF" />
                                        </div>
                                        {user.linkedin_url ? <a href={user.linkedin_url} target="_blank" rel="noreferrer" style={{ color: '#1a1a2e', textDecoration: 'none', borderBottom: '1px solid #0A84FF' }}>View Profile</a> : <span style={{ color: '#94a3b8' }}>No link added</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {user.role === 'instructor' && (
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px', marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Professional Title</label>
                                    {isEditing ? (
                                        <input className="glass-input" value={formData.instructor_title} onChange={e => setFormData({...formData, instructor_title: e.target.value})} placeholder="e.g. Senior Software Architect" style={{ background: 'rgba(0, 0, 0, 0.03)' }} />
                                    ) : (
                                        <p style={{ fontSize: '1.2rem', fontWeight: 700, padding: '4px 0', color: '#1a1a2e' }}>{user.instructor_title || 'Expert Instructor'}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bio / Profile Summary</label>
                            {isEditing ? (
                                <textarea className="glass-input" style={{ minHeight: '140px', resize: 'vertical', background: 'rgba(0, 0, 0, 0.03)', padding: '20px', fontSize: '1rem', lineHeight: 1.6 }} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us about yourself. Use empty lines to separate paragraphs." />
                            ) : (
                                renderTextBlocks(user.bio)
                            )}
                        </div>

                        {user.role === 'instructor' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Professional Experience Timeline</label>
                                {isEditing ? (
                                    <textarea className="glass-input" style={{ minHeight: '220px', resize: 'vertical', background: 'rgba(0, 0, 0, 0.03)', padding: '20px', fontSize: '1rem', lineHeight: 1.6 }} value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="Describe your career journey and achievements.&#10;&#10;Use empty lines to separate distinct experiences into individual milestone cards." />
                                ) : (
                                    renderTextBlocks(user.experience)
                                )}
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>

            {/* Profile Picture Crop Modal */}
            {showCropModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <GlassCard heavy style={{ width: '100%', maxWidth: '450px', padding: '0', overflow: 'hidden', borderRadius: '32px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(0, 0, 0, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.02)' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Adjust Profile Picture</h3>
                            <button onClick={() => setShowCropModal(false)} style={{ background: 'rgba(0, 0, 0, 0.03)', borderRadius: '50%', width: '36px', height: '36px', border: 'none', color: '#334155', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div style={{ position: 'relative', width: '100%', height: '400px', background: '#f5f7fa' }}>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                style={{
                                    containerStyle: { background: '#f5f7fa' }
                                }}
                            />
                        </div>
                        
                        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <ZoomOut size={20} color="rgba(255,255,255,0.5)" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(e.target.value)}
                                    style={{ flex: 1, accentColor: '#0A84FF', height: '4px', background: 'rgba(0, 0, 0, 0.06)', borderRadius: '2px', appearance: 'none' }}
                                />
                                <ZoomIn size={20} color="rgba(255,255,255,0.5)" />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <GlassButton onClick={() => setShowCropModal(false)} style={{ flex: 1, justifyContent: 'center', padding: '14px', borderRadius: '16px' }}>
                                    Cancel
                                </GlassButton>
                                <GlassButton primary onClick={applyCropAndUpload} disabled={loading} style={{ flex: 2, justifyContent: 'center', background: '#0A84FF', padding: '14px', borderRadius: '16px', fontWeight: 800 }}>
                                    {loading ? 'Processing...' : 'Apply & Upload'}
                                </GlassButton>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default Profile;
