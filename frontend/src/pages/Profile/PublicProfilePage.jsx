import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { 
    User as UserIcon, Book, Award, Calendar, 
    ArrowLeft, Mail, Linkedin, Globe, Briefcase,
    Shield, CheckCircle2, TrendingUp, Zap
} from 'lucide-react';

const PublicProfilePage = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // Fetch generic public profile data
                const profileRes = await api.get(`users/profile/${id}/`);
                const data = profileRes.data;
                
                setProfile(data);

                // If they are an instructor, fetch their courses
                if (data.role === 'instructor') {
                    const coursesRes = await api.get(`courses/?instructor=${id}`);
                    setCourses(coursesRes.data.results || coursesRes.data);
                }
            } catch (error) {
                console.error("Error fetching public profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }, [id]);

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}></div>
        </div>
    );

    if (!profile) return (
        <div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>User Not Found</h2>
            <Link to="/catalog">
                <GlassButton>Back to Catalog</GlassButton>
            </Link>
        </div>
    );

    const isInstructor = profile.role === 'instructor';
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;

    return (
        <div style={{ minHeight: '100vh', background: '#040407', color: 'white', padding: '100px 20px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <Link to={window.history.length > 1 ? "#" : "/catalog"} onClick={() => window.history.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: '40px', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                    <ArrowLeft size={16} /> Go Back
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 992 ? '1fr' : '320px 1fr', gap: '60px', alignItems: 'start' }}>
                    
                    {/* Sidebar Identity Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '180px', height: '180px', margin: '0 auto 32px', borderRadius: '48px', background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                                {profile.profile_picture ? (
                                    <img src={profile.profile_picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <UserIcon size={72} color="white" />
                                )}
                            </div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.5px' }}>{fullName}</h1>
                            <p style={{ color: isInstructor ? 'var(--accent-blue)' : '#30D158', fontWeight: 800, fontSize: '0.9rem', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {isInstructor ? <Shield size={16} /> : <CheckCircle2 size={16} />}
                                {isInstructor ? (profile.instructor_title || 'Expert Instructor') : 'Certified Student'}
                            </p>
                            
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                {[Globe, Linkedin, Mail].map((Icon, i) => (
                                    <div key={i} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                        <Icon size={18} color="rgba(255,255,255,0.6)" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Credential KPIs */}
                        <GlassCard heavy style={{ padding: '32px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {isInstructor ? (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 500 }}>Total Courses</span>
                                            <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{courses.length}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 500 }}>Students</span>
                                            <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>8.4k+</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 500 }}>Courses Enrolled</span>
                                            <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>4</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 500 }}>Knowledge Rank</span>
                                            <span style={{ color: '#AF52DE', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' }}>Elite</span>
                                        </div>
                                    </>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 500 }}>Account Status</span>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#30D158' }}>Verified</span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Main Technical Portfolio */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
                        
                        <section>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '28px', color: 'white', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ background: isInstructor ? 'rgba(10, 132, 255, 0.1)' : 'rgba(48, 209, 88, 0.1)', padding: '8px', borderRadius: '12px', display: 'inline-flex' }}>
                                    {isInstructor ? <Briefcase size={22} color="#0A84FF" /> : <UserIcon size={22} color="#30D158" />}
                                </div>
                                {isInstructor ? 'Instructor Biography' : 'About Student'}
                            </h2>
                            <div style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                                {profile.bio || (isInstructor ? "Highly specialized technical expert." : "Knowledgeable student committed to mastering new domains within the kng system.")}
                            </div>
                        </section>

                        {isInstructor && (
                            <section>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '28px', color: 'white', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ background: 'rgba(94, 92, 230, 0.1)', padding: '8px', borderRadius: '12px', display: 'inline-flex' }}>
                                        <Briefcase size={22} color="#5E5CE6" />
                                    </div>
                                    Professional Expertise
                                </h2>
                                <div style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                                    {profile.experience || "Technical mastery across complex industrial domains."}
                                </div>
                            </section>
                        )}

                        {isInstructor && courses.length > 0 && (
                            <section>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ background: 'rgba(48, 209, 88, 0.1)', padding: '8px', borderRadius: '12px', display: 'inline-flex' }}>
                                        <Book size={22} color="#30D158" />
                                    </div>
                                    Curated Course Catalog
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                                    {courses.map(course => (
                                        <GlassCard key={course.id} style={{ padding: '0', overflow: 'hidden', borderRadius: '24px', transition: 'all 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                            <div style={{ height: '160px', background: course.thumbnail ? `url(${course.thumbnail}) center/cover` : 'rgba(255,255,255,0.05)', position: 'relative' }}>
                                                 <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #040407, transparent)' }} />
                                            </div>
                                            <div style={{ padding: '24px', position: 'relative', marginTop: '-40px' }}>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: 'white', lineHeight: 1.4 }}>{course.title}</h4>
                                                <Link to={`/course/${course.id}`} style={{ textDecoration: 'none' }}>
                                                    <GlassButton variant="primary" style={{ width: '100%', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                        Experience Course
                                                    </GlassButton>
                                                </Link>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        {!isInstructor && (
                            <section>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '28px', color: 'white', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ background: 'rgba(255, 214, 10, 0.1)', padding: '8px', borderRadius: '12px', display: 'inline-flex' }}>
                                        <Zap size={22} color="#FFD60A" />
                                    </div>
                                    Learning Progress
                                </h2>
                                <GlassCard style={{ padding: '32px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                         {[
                                             { label: 'Completed Lessons', val: '42' },
                                             { label: 'Achieved Badges', val: '7' },
                                             { label: 'Average Score', val: '94%' }
                                         ].map((stat, i) => (
                                             <div key={i} style={{ flex: 1, minWidth: '120px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', textAlign: 'center' }}>
                                                 <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginBottom: '4px' }}>{stat.val}</p>
                                                 <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 800 }}>{stat.label}</p>
                                             </div>
                                         ))}
                                    </div>
                                </GlassCard>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicProfilePage;
