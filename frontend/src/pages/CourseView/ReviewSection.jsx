import React, { useState, useEffect } from 'react';
import { Star, Send, MessageSquare, User } from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { GlassInput } from '../../components/common/GlassInput';
import api from '../../services/api';

export const ReviewSection = ({ courseId }) => {
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hover, setHover] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReviews = async () => {
        try {
            const response = await api.get(`reviews/?course=${courseId}`);
            setReviews(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (err) {
            console.error("Error fetching reviews:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [courseId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await api.post('reviews/', {
                course: courseId,
                rating,
                comment
            });
            setComment('');
            setRating(5);
            fetchReviews();
        } catch (err) {
            const msg = err.response?.data?.detail || "You've already reviewed this course or an error occurred.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageSquare size={24} color="var(--accent-blue)" /> Course Reviews
            </h3>

            {/* Review Form */}
            <GlassCard style={{ padding: '24px', marginBottom: '32px', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Your Rating</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', padding: '4px' }}
                                >
                                    <Star 
                                        size={28} 
                                        fill={(hover || rating) >= star ? "#FFD700" : "none"} 
                                        stroke={(hover || rating) >= star ? "#FFD700" : "var(--text-secondary)"}
                                        style={{ transition: 'all 0.2s ease' }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <textarea
                            placeholder="Share your experience with this course..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={{ 
                                width: '100%', 
                                minHeight: '100px', 
                                background: 'rgba(0, 0, 0, 0.03)', 
                                border: '1px solid rgba(0, 0, 0, 0.08)', 
                                borderRadius: '12px', 
                                padding: '16px', 
                                color: '#1a1a2e', 
                                fontSize: '1rem',
                                outline: 'none',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '16px' }}>{error}</p>}

                    <GlassButton 
                        primary 
                        type="submit" 
                        disabled={submitting} 
                        style={{ padding: '12px 24px', gap: '8px' }}
                    >
                        {submitting ? 'Submitting...' : <><Send size={18} /> Post Review</>}
                    </GlassButton>
                </form>
            </GlassCard>

            {/* Review List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Loading reviews...</p>
                ) : reviews.length > 0 ? (
                    reviews.map((rev) => (
                        <GlassCard key={rev.id} style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0, 0, 0, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={20} color="var(--text-secondary)" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{rev.student_name}</h4>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star 
                                                    key={s} 
                                                    size={12} 
                                                    fill={rev.rating >= s ? "#FFD700" : "none"} 
                                                    stroke={rev.rating >= s ? "#FFD700" : "var(--text-secondary)"} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {new Date(rev.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                                {rev.comment}
                            </p>
                        </GlassCard>
                    ))
                ) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No reviews yet. Be the first to share your thoughts!</p>
                )}
            </div>
        </div>
    );
};
