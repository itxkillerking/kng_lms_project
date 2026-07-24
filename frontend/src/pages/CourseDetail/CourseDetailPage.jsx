import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import {
    PlayCircle, Clock, BookOpen, Users,
    ChevronRight, CheckCircle, Info, Star,
    Award, Globe, Calendar, ArrowLeft, Mail, Briefcase, Book, Linkedin, User as UserIcon
} from 'lucide-react';

const CourseDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrolling, setEnrolling] = useState(false);

    // Responsive Handling
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth <= 1024;
    const isSmallMobile = windowWidth <= 480;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`courses/${id}/`);
                setCourse(response.data);

                if (user) {
                    const enrollRes = await api.get('courses/my_courses/');
                    const enrolledIds = enrollRes.data.map(c => c.id);
                    setIsEnrolled(enrolledIds.includes(parseInt(id)));
                }
            } catch (error) {
                console.error("Error fetching course detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const handleEnroll = async () => {
        if (!user) {
            // Save current path for redirection after login
            const currentPath = window.location.pathname;
            navigate(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
            return;
        }

        if (isEnrolled) {
            navigate(`/learn/${id}`);
            return;
        }

        setEnrolling(true);
        try {
            await api.post(`courses/${id}/enroll/`);
            setIsEnrolled(true);
            // Optionally show success message or navigate
            navigate(`/learn/${id}`);
        } catch (error) {
            console.error("Enrollment failed:", error);
            alert("Enrollment failed. Please try again.");
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}></div>
        </div>
    );

    if (!course) return <div style={{ padding: '80px', textAlign: 'center', color: '#1a1a2e' }}>Course not found.</div>;

    const sections = [
        { icon: <Clock size={20} />, label: 'Duration', value: `${course.total_duration_mins} mins` },
        { icon: <BookOpen size={20} />, label: 'Lessons', value: course.total_lessons },
        { icon: <Award size={20} />, label: 'Certificates', value: 'Yes' },
        { icon: <Globe size={20} />, label: 'Language', value: 'English' }
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fa', color: '#1a1a2e', paddingBottom: '100px' }}>
            {/* Dark Hero Section */}
            <div style={{
                position: 'relative',
                padding: isMobile ? '100px 20px 60px' : '120px 20px 80px',
                background: 'linear-gradient(180deg, rgba(10, 132, 255, 0.05) 0%, rgba(4, 4, 7, 0) 100%)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Link to="/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '32px', fontSize: '0.9rem', fontWeight: 600 }}>
                        <ArrowLeft size={16} /> Back to Catalog
                    </Link>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 400px', gap: isMobile ? '40px' : '60px', alignItems: 'start' }}>
                        <div style={{ display: isMobile ? 'contents' : 'block' }}>
                            <div>
                                <div style={{ display: 'inline-flex', padding: '6px 12px', background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.2)', borderRadius: '20px', color: '#0A84FF', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>
                                    {course.category_name || 'Technology'}
                                </div>
                                <h1 style={{ fontSize: isSmallMobile ? '2.2rem' : isMobile ? '2.8rem' : '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em' }}>{course.title}</h1>

                                {/* Restored/Added Social Proof */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFD60A', fontSize: '1.1rem', fontWeight: 700 }}>
                                        <Star size={18} fill="#FFD60A" /> {course.average_rating || '4.9'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>
                                        <Users size={18} /> {course.student_count || '1.2k'} students enrolled
                                    </div>
                                </div>

                                <p style={{ fontSize: isSmallMobile ? '1rem' : '1.2rem', color: '#475569', lineHeight: 1.6, marginBottom: '40px', maxWidth: '700px' }}>
                                    {course.description || "Master advanced concepts with expert-led training. This course covers everything from fundamentals to production-grade implementation."}
                                </p>

                                <div style={{ display: 'flex', gap: isSmallMobile ? '20px' : '32px', flexWrap: 'wrap' }}>
                                    {sections.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ color: '#0A84FF' }}>{s.icon}</div>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>{s.label}</p>
                                                <p style={{ fontSize: '1rem', fontWeight: 700 }}>{s.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isMobile && (
                                <div style={{ marginTop: '40px' }}>
                                    <EnrollmentCard course={course} isMobile={isMobile} isSmallMobile={isSmallMobile} handleEnroll={handleEnroll} enrolling={enrolling} isEnrolled={isEnrolled} />
                                </div>
                            )}
                        </div>

                        {!isMobile && (
                            <EnrollmentCard course={course} isMobile={isMobile} isSmallMobile={isSmallMobile} handleEnroll={handleEnroll} enrolling={enrolling} isEnrolled={isEnrolled} />
                        )}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div style={{ maxWidth: '1200px', margin: isSmallMobile ? '32px auto 0' : '60px auto 0', padding: '0 20px' }}>
                <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 400px', gap: isMobile ? '48px' : '60px', display: 'grid' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
                        {/* Description */}
                        <section>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px' }}>Course Description</h2>
                            <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                                {course.description}
                            </div>
                        </section>

                        {/* Curriculum */}
                        <section>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Course Content</h2>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                    {course.modules?.length} modules • {course.total_lessons} lessons
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {course.modules?.map((m, i) => (
                                    <GlassCard key={m.id} style={{ padding: '24px', borderRadius: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (m.lessons?.length > 0 ? '16px' : '0') }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#94a3b8' }}>0{i + 1}</span>
                                                <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{m.title}</h4>
                                            </div>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{m.lessons?.length} items</span>
                                        </div>
                                        {m.lessons?.map((l) => (
                                            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0 12px 40px', borderTop: '1px solid rgba(0, 0, 0, 0.04)' }}>
                                                <PlayCircle size={14} color="rgba(255,255,255,0.3)" />
                                                <span style={{ fontSize: '0.95rem', color: '#475569' }}>{l.title}</span>
                                            </div>
                                        ))}
                                    </GlassCard>
                                ))}
                            </div>
                        </section>

                        {/* Instructor */}
                        <section id="instructor">
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '32px' }}>Your Instructor</h2>
                            <GlassCard style={{ padding: isSmallMobile ? '24px' : '40px', borderRadius: '32px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                                <div style={{ display: 'flex', flexDirection: isSmallMobile ? 'column' : 'row', gap: isSmallMobile ? '32px' : '48px', alignItems: isSmallMobile ? 'center' : 'flex-start' }}>
                                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                                        <div style={{ width: '120px', height: '120px', borderRadius: '32px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', overflow: 'hidden', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                                            {course.instructor_picture ? (
                                                <img src={course.instructor_picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <UserIcon size={48} color="white" />
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 0, 0, 0.06)', cursor: 'pointer' }}>
                                                <Globe size={16} color="rgba(255,255,255,0.4)" />
                                            </div>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 0, 0, 0.06)', cursor: 'pointer' }}>
                                                <Mail size={16} color="rgba(255,255,255,0.4)" />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: isSmallMobile ? 'center' : 'left' }}>
                                        <Link to={`/instructor/${course.instructor}`} style={{ textDecoration: 'none' }}>
                                            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px', color: '#1a1a2e' }}>{course.instructor_name}</h3>
                                        </Link>
                                        <p style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {course.instructor_title || 'Expert Instructor'}
                                        </p>
                                        <p style={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '24px' }}>
                                            {course.instructor_bio || 'A dedicated educator focused on delivering high-quality technical curriculum for modern professionals.'}
                                        </p>
                                        <Link to={`/instructor/${course.instructor}`} style={{ color: 'var(--accent-blue)', fontSize: '0.9rem', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: isSmallMobile ? 'center' : 'flex-start', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.gap = '10px'} onMouseLeave={e => e.currentTarget.style.gap = '6px'}>
                                            Explore Instructor Profile <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                                        </Link>
                                    </div>
                                </div>
                            </GlassCard>
                        </section>
                    </div>

                    {/* Right Info Column (Optional/Extra) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Course Info</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Quizzes</span>
                                    <span style={{ fontWeight: 700 }}>{course.total_quizzes}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Assignments</span>
                                    <span style={{ fontWeight: 700 }}>{course.total_assignments}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Student Level</span>
                                    <span style={{ fontWeight: 700 }}>All Levels</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '24px', background: 'rgba(10, 132, 255, 0.05)', borderRadius: '24px', border: '1px solid rgba(10, 132, 255, 0.1)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Info size={18} color="#0A84FF" /> Note
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                                You will receive a professional certificate upon completion of all modules and assessments.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EnrollmentCard = ({ course, isMobile, isSmallMobile, handleEnroll, enrolling, isEnrolled }) => (
    <GlassCard heavy style={{ position: isMobile ? 'static' : 'sticky', top: '40px', padding: isSmallMobile ? '24px' : '32px', borderRadius: '32px', width: '100%', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
        <div style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(0, 0, 0, 0.03)', borderRadius: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {course.thumbnail ? (
                <img src={course.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <PlayCircle size={48} color="rgba(255,255,255,0.1)" />
            )}
        </div>
        <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>{course.price > 0 ? `$${course.price}` : 'Free'}</span>
                {course.price > 0 && <span style={{ color: '#64748b', textDecoration: 'line-through', fontSize: '1.2rem' }}>$199.99</span>}
            </div>
            <p style={{ fontSize: '0.9rem', color: '#30D158', fontWeight: 700, marginTop: '8px' }}>Full lifetime access</p>
        </div>

        <GlassButton
            variant="primary"
            style={{ width: '100%', py: '18px', fontSize: '1.1rem', borderRadius: '16px', fontWeight: 800 }}
            onClick={handleEnroll}
            disabled={enrolling}
        >
            {isEnrolled ? 'Go to Classroom' : (enrolling ? 'Enrolling...' : 'Enroll Now')}
        </GlassButton>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                <CheckCircle size={14} color="#30D158" /> Access on mobile and TV
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                <CheckCircle size={14} color="#30D158" /> Certificate of completion
            </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginTop: '24px', borderTop: '1px solid rgba(0, 0, 0, 0.05)', paddingTop: '16px' }}>
            30-Day Money-Back Guarantee
        </p>
    </GlassCard>
);

export default CourseDetailPage;
