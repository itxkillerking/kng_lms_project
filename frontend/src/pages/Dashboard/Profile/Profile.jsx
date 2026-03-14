import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { User as UserIcon, Mail, Phone, Calendar, Edit3, Save, X, Camera, Shield } from 'lucide-react';
import api from '../../../services/api';

const Profile = () => {
    const { user, login } = useAuth(); // We use login function to refresh user context
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        phone_number: '',
        instructor_title: '',
        experience: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                bio: user.bio || '',
                phone_number: user.phone_number || '',
                email: user.email || '',
                instructor_title: user.instructor_title || '',
                experience: user.experience || ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await api.patch('users/me/', formData);
            // Refresh user data in context
            const userRes = await api.get('users/me/');
            // Assuming the login function in AuthContext can take user data or we just let it fetch
            // For now, let's assume we need to update the context
            setIsEditing(false);
            window.location.reload(); // Quickest way to refresh AuthContext for now
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div style={{ color: 'white', padding: '40px' }}>Loading Profile...</div>;

    const initials = `${user.first_name?.[0] || user.username[0]}${user.last_name?.[0] || ''}`.toUpperCase();

    return (
        <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', color: 'white' }}>Your Profile</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your personal information and preferences.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '32px' }}>
                {/* Profile Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <GlassCard heavy style={{ padding: '32px', textAlign: 'center', position: 'relative' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                            {user.profile_picture ? (
                                <img src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '3rem', fontWeight: 700, color: 'white' }}>{initials}</span>
                            )}
                            <input 
                                type="file" 
                                id="profile-upload" 
                                hidden 
                                accept="image/*"
                                onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                        const file = e.target.files[0];
                                        const formData = new FormData();
                                        formData.append('profile_picture', file);
                                        setLoading(true);
                                        try {
                                            await api.patch('users/me/', formData, {
                                                headers: { 'Content-Type': 'multipart/form-data' }
                                            });
                                            window.location.reload();
                                        } catch (error) {
                                            console.error("Upload failed:", error);
                                            alert("Failed to upload image.");
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }}
                            />
                            <div 
                                onClick={() => document.getElementById('profile-upload').click()}
                                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: isEditing ? 1 : 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                onMouseEnter={e => !isEditing && (e.currentTarget.style.opacity = 1)}
                                onMouseLeave={e => !isEditing && (e.currentTarget.style.opacity = 0)}
                            >
                                <Camera size={24} color="white" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>{user.first_name} {user.last_name}</h2>
                        <p style={{ color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>{user.role}</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <Shield size={14} /> <span>Verified {user.role}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <Calendar size={14} /> <span>Joined {new Date(user.joined_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <GlassCard heavy style={{ padding: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Personal Information</h3>
                            {!isEditing ? (
                                <GlassButton onClick={() => setIsEditing(true)} style={{ gap: '8px', fontSize: '0.9rem', padding: '10px 20px' }}>
                                    <Edit3 size={16} /> Edit Profile
                                </GlassButton>
                            ) : (
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <GlassButton onClick={() => setIsEditing(false)} style={{ gap: '8px', fontSize: '0.9rem', background: 'rgba(255,69,58,0.1)', color: '#ff453a', borderColor: 'rgba(255,69,58,0.2)' }}>
                                        <X size={16} /> Cancel
                                    </GlassButton>
                                    <GlassButton onClick={handleSave} className="primary" disabled={loading} style={{ gap: '8px', fontSize: '0.9rem' }}>
                                        <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                                    </GlassButton>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>First Name</label>
                                {isEditing ? (
                                    <input className="glass-input" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                                ) : (
                                    <p style={{ fontSize: '1.1rem', padding: '12px 0' }}>{user.first_name || 'Not provided'}</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Last Name</label>
                                {isEditing ? (
                                    <input className="glass-input" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                                ) : (
                                    <p style={{ fontSize: '1.1rem', padding: '12px 0' }}>{user.last_name || 'Not provided'}</p>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</label>
                            {isEditing ? (
                                <input className="glass-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', padding: '12px 0' }}>
                                    <Mail size={18} color="var(--accent-blue)" /> {user.email}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone Number</label>
                            {isEditing ? (
                                <input className="glass-input" placeholder="+1 (555) 000-0000" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', padding: '12px 0' }}>
                                    <Phone size={18} color="var(--accent-blue)" /> {user.phone_number || 'No phone number added'}
                                </div>
                            )}
                        </div>

                        {user.role === 'instructor' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Professional Title</label>
                                    {isEditing ? (
                                        <input className="glass-input" value={formData.instructor_title} onChange={e => setFormData({...formData, instructor_title: e.target.value})} placeholder="e.g. Senior Software Architect" />
                                    ) : (
                                        <p style={{ fontSize: '1.1rem', padding: '12px 0' }}>{user.instructor_title || 'Expert Instructor'}</p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Years of Experience</label>
                                    {isEditing ? (
                                        <input className="glass-input" type="number" placeholder="Years" />
                                    ) : (
                                        <p style={{ fontSize: '1.1rem', padding: '12px 0' }}>Professional Academician</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Bio / Profile Summary</label>
                            {isEditing ? (
                                <textarea className="glass-input" style={{ minHeight: '120px', resize: 'vertical' }} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us about yourself..." />
                            ) : (
                                <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', padding: '12px 0' }}>
                                    {user.bio || 'No bio provided.'}
                                </p>
                            )}
                        </div>

                        {user.role === 'instructor' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Professional Experience</label>
                                {isEditing ? (
                                    <textarea className="glass-input" style={{ minHeight: '160px', resize: 'vertical' }} value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="Describe your career journey and achievements..." />
                                ) : (
                                    <div style={{ fontSize: '1.05rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', padding: '12px 0', whiteSpace: 'pre-wrap' }}>
                                        {user.experience || 'Experience details have not been shared yet.'}
                                    </div>
                                )}
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default Profile;
