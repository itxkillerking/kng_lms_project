import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { GlassSelect } from '../../../components/common/GlassSelect';
import { 
    Settings, 
    Layers, 
    Plus, 
    Trash2, 
    Bell, 
    Shield, 
    AlertTriangle,
    Tag,
    RefreshCw,
    Image as ImageIcon,
    Palette,
    Mail,
    Smartphone
} from 'lucide-react';
import api from '../../../services/api';

export const SystemSettings = () => {
    const [categories, setCategories] = useState([]);
    const [globalSettings, setGlobalSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({ name: '', icon_name: 'Book' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, setRes] = await Promise.all([
                api.get('categories/'),
                api.get('core/settings/')
            ]);
            setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.results || []);
            setGlobalSettings(Array.isArray(setRes.data) ? setRes.data : setRes.data.results || []);
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddCategory = async () => {
        if (!newCategory.name) return;
        try {
            await api.post('categories/', newCategory);
            setNewCategory({ name: '', icon_name: 'Book' });
            fetchData();
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await api.delete(`categories/${id}/`);
                fetchData();
            } catch (error) {
                console.error("Error deleting category:", error);
            }
        }
    };

    const handleUpdateSetting = async (key, value) => {
        try {
            // Check if key exists in globalSettings
            const exists = globalSettings.find(s => s.key === key);
            if (exists) {
                await api.patch(`core/settings/${key}/`, { value });
            } else {
                await api.post('core/settings/', { key, value });
            }
            fetchData();
        } catch (error) {
            console.error("Error updating setting:", error);
        }
    };

    const getSettingValue = (key, defaultValue = '') => {
        const setting = globalSettings.find(s => s.key === key);
        return setting ? setting.value : defaultValue;
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', color: '#1a1a2e' }}>System Control</h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Manage platform identity, communication rules, and categories.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
                
                {/* Branding & Identity */}
                <GlassCard heavy style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ImageIcon size={22} color="var(--accent-blue)" /> Platform Branding
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '8px' }}>Logo URL</label>
                            <input 
                                className="glass-input" 
                                value={getSettingValue('logo_url')}
                                placeholder="https://example.com/logo.png"
                                onChange={(e) => handleUpdateSetting('logo_url', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '8px' }}>Primary Accent Color</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input 
                                    className="glass-input" 
                                    type="color"
                                    style={{ width: '60px', padding: '4px', height: '48px', cursor: 'pointer' }}
                                    value={getSettingValue('primary_color', '#0A84FF')}
                                    onChange={(e) => handleUpdateSetting('primary_color', e.target.value)}
                                />
                                <input 
                                    className="glass-input" 
                                    value={getSettingValue('primary_color', '#0A84FF')}
                                    onChange={(e) => handleUpdateSetting('primary_color', e.target.value)}
                                    placeholder="#0A84FF"
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Notifications & Security */}
                <GlassCard heavy style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Bell size={22} color="var(--accent-purple)" /> Communication & Security
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ color: '#1a1a2e', fontWeight: 600, fontSize: '0.95rem' }}>Registration Emails</h4>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Send welcome email to new users.</p>
                            </div>
                            <Toggle 
                                active={getSettingValue('email_on_register', true)} 
                                onToggle={(val) => handleUpdateSetting('email_on_register', val)} 
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ color: '#1a1a2e', fontWeight: 600, fontSize: '0.95rem' }}>Enrollment Emails</h4>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Notify students on course enrollment.</p>
                            </div>
                            <Toggle 
                                active={getSettingValue('email_on_enroll', true)} 
                                onToggle={(val) => handleUpdateSetting('email_on_enroll', val)} 
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ color: '#1a1a2e', fontWeight: 600, fontSize: '0.95rem' }}>OTP Verification</h4>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Require OTP for password resets.</p>
                            </div>
                            <Toggle 
                                active={getSettingValue('otp_enabled', true)} 
                                onToggle={(val) => handleUpdateSetting('otp_enabled', val)} 
                            />
                        </div>
                    </div>
                </GlassCard>

                {/* Categories */}
                <GlassCard heavy style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Layers size={22} color="#10b981" /> Course Categories
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <input 
                            className="glass-input" 
                            placeholder="New category..." 
                            style={{ flex: 1, marginBottom: 0 }}
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        />
                        <GlassButton onClick={handleAddCategory} style={{ padding: '0 16px' }}>
                            <Plus size={20} />
                        </GlassButton>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {categories.map(cat => (
                            <div key={cat.id} style={{ 
                                padding: '10px 14px', 
                                borderRadius: '12px', 
                                background: 'rgba(0, 0, 0, 0.03)', 
                                border: '1px solid rgba(0, 0, 0, 0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a2e' }}>{cat.name}</span>
                                <button 
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255, 69, 58, 0.4)', cursor: 'pointer' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Maintenance */}
                <GlassCard heavy style={{ padding: '32px', borderColor: 'rgba(255, 69, 58, 0.2)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ff453a', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Shield size={22} /> Danger Zone
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h4 style={{ color: '#1a1a2e', fontWeight: 600, fontSize: '0.95rem' }}>Maintenance Mode</h4>
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Block all students from content.</p>
                        </div>
                        <Toggle 
                            active={getSettingValue('maintenance_mode', false)} 
                            onToggle={(val) => handleUpdateSetting('maintenance_mode', val)} 
                            danger
                        />
                    </div>
                    <div style={{ marginTop: '32px' }}>
                        <GlassButton wide style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.2)', color: '#ff453a' }}>
                            <RefreshCw size={18} style={{ marginRight: '10px' }} /> Reset System Cache
                        </GlassButton>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

const Toggle = ({ active, onToggle, danger = false }) => (
    <div 
        onClick={() => onToggle(!active)}
        style={{ 
            width: '48px', 
            height: '26px', 
            borderRadius: '13px', 
            background: active ? (danger ? '#ff453a' : '#0A84FF') : 'rgba(255,255,255,0.1)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
    >
        <div style={{ 
            position: 'absolute', 
            top: '3px', 
            left: active ? '25px' : '3px', 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            background: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
    </div>
);
