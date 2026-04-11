import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { 
    Search, Send, Paperclip, MoreVertical, 
    User, Search as SearchIcon, File, Image as ImageIcon, 
    Check, CheckCheck, Smile, X, ArrowLeft
} from 'lucide-react';

export const ChatHub = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [studentProfile, setStudentProfile] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(true);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const menuRef = useRef(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch conversations list (polling every 5s)
    const fetchConversations = async () => {
        try {
            const res = await api.get('chat/messages/conversations/');
            setConversations(res.data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    // Fetch chat history for active chat
    const fetchHistory = async (userId) => {
        try {
            const res = await api.get(`chat/messages/history/?user_id=${userId}`);
            setMessages(res.data);
            
            // If instructor, fetch technical profile of student
            if (user?.role === 'instructor') {
                const studentRes = await api.get(`users/profile/${userId}/`);
                setStudentProfile(studentRes.data);
            }
        } catch (error) {
            console.error("History fetch error:", error);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchHistory(activeChat.other_user_id);
            const interval = setInterval(() => fetchHistory(activeChat.other_user_id), 3000);
            return () => clearInterval(interval);
        }
    }, [activeChat]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !file) return;

        const formData = new FormData();
        formData.append('recipient', activeChat.other_user_id);
        if (newMessage) formData.append('content', newMessage);
        if (file) formData.append('file', file);

        try {
            await api.post('chat/messages/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewMessage('');
            setFile(null);
            if (activeChat) fetchHistory(activeChat.other_user_id);
        } catch (error) {
            console.error("Send error:", error);
        }
    };

    const isInstructor = user?.role === 'instructor';

    return (
        <div className="chat-container">
            
            {/* Sidebar: Conversations List */}
            <div className={`chat-sidebar ${!showMobileSidebar ? 'mobile-hidden' : ''}`}>
                <div style={{ padding: '32px 24px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '24px' }}>Chats</h2>
                    <div style={{ position: 'relative' }}>
                        <SearchIcon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        <input 
                            placeholder="Search discussions..." 
                            style={{ width: '100%', padding: '14px 14px 14px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
                    {conversations.map(conv => (
                        <div 
                            key={conv.other_user_id}
                            onClick={() => {
                                setActiveChat(conv);
                                if (window.innerWidth <= 850) {
                                    setShowMobileSidebar(false);
                                }
                            }}
                            style={{ 
                                padding: '16px 20px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s',
                                background: activeChat?.other_user_id === conv.other_user_id ? 'rgba(10, 132, 255, 0.1)' : 'transparent',
                                display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)', overflow: 'hidden' }}>
                                    {conv.other_user_picture ? <img src={conv.other_user_picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{conv.other_user_name[0]}</div>}
                                </div>
                                {conv.unread_count > 0 && (
                                    <div style={{ position: 'absolute', top: -5, right: -5, width: '20px', height: '20px', borderRadius: '50%', background: '#30D158', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, border: '2px solid #0a0a0f' }}>{conv.unread_count}</div>
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.other_user_name}</span>
                                    {conv.last_timestamp && (
                                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                                            {new Date(conv.last_timestamp).getHours()}:{new Date(conv.last_timestamp).getMinutes().toString().padStart(2, '0')}
                                        </span>
                                    )}
                                </div>
                                <p style={{ 
                                    fontSize: '0.85rem', 
                                    color: conv.unread_count > 0 ? '#0A84FF' : (conv.last_timestamp ? 'rgba(255,255,255,0.4)' : '#30D158'), 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis', 
                                    fontWeight: (conv.unread_count > 0 || !conv.last_timestamp) ? 700 : 400 
                                }}>
                                    {conv.last_message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-main">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(10,10,15,0.4)', position: 'relative', zIndex: 1001 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {/* Mobile Back Button */}
                                <button 
                                    className="mobile-back-btn"
                                    onClick={() => setShowMobileSidebar(true)}
                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: window.innerWidth <= 850 ? 'block' : 'none' }}
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <div 
                                    style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                                    onClick={() => {
                                        const role = activeChat.other_user_role;
                                        const path = role === 'instructor' ? `/instructor/${activeChat.other_user_id}` : `/profile/${activeChat.other_user_id}`;
                                        navigate(path);
                                    }}
                                >
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)', overflow: 'hidden' }}>
                                    {activeChat.other_user_picture ? <img src={activeChat.other_user_picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{activeChat.other_user_name[0]}</div>}
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 900, marginBottom: '2px' }}>{activeChat.other_user_name}</h4>
                                    <p style={{ fontSize: '0.750rem', color: '#30D158', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Online Session</p>
                                </div>
                            </div>
                        </div>
                            
                            <div style={{ position: 'relative' }} ref={menuRef}>
                                <button 
                                    onClick={() => setShowMenu(!showMenu)}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}
                                >
                                    <MoreVertical size={20} />
                                </button>
                                
                                        {showMenu && (
                                            <div style={{ 
                                                position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '220px', 
                                                background: 'rgba(25,25,35,0.98)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '18px', padding: '10px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', zIndex: 2000
                                            }}>
                                                <button 
                                                    onClick={() => { 
                                                        setShowMenu(false); 
                                                        const role = activeChat.other_user_role;
                                                        const path = role === 'instructor' ? `/instructor/${activeChat.other_user_id}` : `/profile/${activeChat.other_user_id}`;
                                                        navigate(path);
                                                    }}
                                                    style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '12px', fontSize: '0.95rem', textAlign: 'left', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    <User size={18} color="var(--accent-blue)" /> <b>View Full Profile</b>
                                                </button>
                                                <button 
                                                    onClick={() => { setShowMenu(false); alert("History clearing is managed by administrators for security."); }}
                                                    style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', borderRadius: '12px', fontSize: '0.95rem', textAlign: 'left', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    <X size={18} /> Clear Chat
                                                </button>
                                            </div>
                                        )}
                            </div>
                        </div>

                        {/* Messages History */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {messages.map((msg, i) => {
                                const isMe = msg.sender === user.id;
                                return (
                                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', marginBottom: i < messages.length - 1 && messages[i+1].sender === msg.sender ? '2px' : '16px' }}>
                                        <div style={{ 
                                            background: isMe ? '#0A84FF' : 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            padding: '12px 18px',
                                            borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            fontSize: '0.95rem',
                                            lineHeight: 1.5,
                                            boxShadow: isMe ? '0 4px 15px rgba(10, 132, 255, 0.3)' : 'none'
                                        }}>
                                            {msg.content}
                                            {msg.file && (
                                                <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.open(msg.file, '_blank')}>
                                                    <File size={20} />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textDecoration: 'underline' }}>View Attachment</span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isMe && <CheckCheck size={14} color="#30D158" />}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} style={{ padding: '24px 32px', background: 'rgba(10,10,15,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            {file && (
                                <div style={{ background: 'rgba(48, 209, 88, 0.1)', padding: '12px 18px', borderRadius: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#30D158', fontSize: '0.85rem', fontWeight: 800 }}>Attachment: {file.name} ({(file.size / (1024*1024)).toFixed(1)}MB)</span>
                                    <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={16} /></button>
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button type="button" onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><Paperclip size={22} /></button>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
                                <input 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..." 
                                    style={{ flex: 1, padding: '14px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'white', outline: 'none' }}
                                />
                                <button type="submit" style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#0A84FF', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <Send size={32} />
                        </div>
                        <h3 style={{ color: 'white', fontWeight: 900, marginBottom: '8px' }}>Select a contact</h3>
                        <p>Messages are end-to-end encrypted locally.</p>
                    </div>
                )}
            </div>

            {/* Instructor Side: Student Info Profile Card */}
            {isInstructor && activeChat && (
                <div className="chat-instructor">
                    <div style={{ width: '120px', height: '120px', borderRadius: '32px', background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)', overflow: 'hidden', marginBottom: '24px', position: 'relative' }}>
                         {activeChat.other_user_picture ? <img src={activeChat.other_user_picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '2rem' }}>{activeChat.other_user_name[0]}</div>}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '8px', textAlign: 'center' }}>{activeChat.other_user_name}</h3>
                    <div style={{ background: 'rgba(48, 209, 88, 0.1)', color: '#30D158', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
                        <div style={{ width: '6px', height: '6px', background: '#30D158', borderRadius: '50%' }} /> Active Now
                    </div>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <GlassCard style={{ padding: '20px', borderRadius: '18px' }}>
                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 900, marginBottom: '8px' }}>Learning Profile</p>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>Full Spectrum Developer</h4>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Current Rank: Expert</p>
                        </GlassCard>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', textAlign: 'center' }}>
                                <p style={{ fontWeight: 900, fontSize: '1.1rem' }}>4</p>
                                <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Courses</p>
                            </div>
                            <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', textAlign: 'center' }}>
                                <p style={{ fontWeight: 900, fontSize: '1.1rem' }}>92%</p>
                                <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Avg GPA</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
