import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { MessageSquare, Send, Reply, Trash2, User, Award } from 'lucide-react';

const Comment = ({ comment, onReply, isInstructor }) => {
    return (
        <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {comment.user_picture ? <img src={comment.user_picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="white" />}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{comment.user_name}</span>
                        {comment.user_role === 'instructor' && (
                            <span style={{ background: 'rgba(10, 132, 255, 0.1)', color: '#0A84FF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Instructor</span>
                        )}
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '0.9rem', marginBottom: '12px' }}>{comment.content}</p>
                    
                    <button 
                        onClick={() => onReply(comment)}
                        style={{ background: 'none', border: 'none', color: '#0A84FF', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: 0 }}
                    >
                        <Reply size={14} /> Reply
                    </button>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div style={{ marginTop: '20px', paddingLeft: '24px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                            {comment.replies.map(reply => (
                                <Comment key={reply.id} comment={reply} onReply={onReply} isInstructor={isInstructor} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const CommentSection = ({ lessonId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        try {
            // The 'comments' are now part of the lesson data, but we can fetch them separately too
            const res = await api.get(`lesson-comments/?lesson_id=${lessonId}`);
            setComments(res.data.results || res.data);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (lessonId) fetchComments();
    }, [lessonId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await api.post('lesson-comments/', {
                lesson: lessonId,
                content: newComment,
                parent: replyingTo ? replyingTo.id : null
            });
            setNewComment('');
            setReplyingTo(null);
            fetchComments();
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    const isInstructor = user?.role === 'instructor';

    return (
        <GlassCard style={{ padding: '32px', borderRadius: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <MessageSquare size={24} color="#0A84FF" />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Technical Discussion</h3>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '48px' }}>
                {replyingTo && (
                    <div style={{ background: 'rgba(10, 132, 255, 0.1)', padding: '12px 18px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: '#0A84FF' }}>Replying to <strong>{replyingTo.user_name}</strong></span>
                        <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Cancel</button>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <textarea 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyingTo ? "Write your reply..." : "Ask a technical question..."}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', color: 'white', fontSize: '0.95rem', minHeight: '100px', resize: 'vertical', outline: 'none', transition: 'border-color 0.3s' }}
                            onFocus={e => e.target.style.borderColor = '#0A84FF'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>
                    <GlassButton type="submit" style={{ borderRadius: '14px', padding: '14px' }}>
                        <Send size={20} />
                    </GlassButton>
                </div>
            </form>

            {/* Comments List */}
            {loading ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Loading discussion...</p>
            ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
                    <MessageSquare size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.3)' }}>No technical questions yet. Be the first to start the discussion!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {comments.filter(c => !c.parent).map(comment => (
                        <Comment key={comment.id} comment={comment} onReply={setReplyingTo} isInstructor={isInstructor} />
                    ))}
                </div>
            )}
        </GlassCard>
    );
};
