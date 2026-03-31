import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { 
    User as UserIcon, Book, Award, Calendar, 
    ArrowLeft, Mail, Linkedin, Globe, Briefcase
} from 'lucide-react';

const InstructorProfilePage = () => {
    const { id } = useParams();
    const [instructor, setInstructor] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructorData = async () => {
            try {
                // Fetch user detail
                const userRes = await api.get(`users/me/`); // In a real app, this would be a public user endpoint
                // But since we only have /me/ for now, let's try to fetch courses by instructor ID
                const coursesRes = await api.get(`courses/?instructor=${id}`);
                
                setCourses(coursesRes.data.results || coursesRes.data);
                
                // If there are courses, the first course has instructor info we can use
                if (coursesRes.data.results?.length > 0 || coursesRes.data?.length > 0) {
                    const firstCourse = coursesRes.data.results?.[0] || coursesRes.data[0];
                    setInstructor({
                        name: firstCourse.instructor_name,
                        title: firstCourse.instructor_title,
                        bio: firstCourse.instructor_bio,
                        picture: firstCourse.instructor_picture,
                        experience: firstCourse.instructor_experience
                    });
                }
            } catch (error) {
                console.error("Error fetching instructor profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInstructorData();
    }, [id]);

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}></div>
        </div>
    );

    if (!instructor) return (
        <div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Instructor Not Found</h2>
            <Link to="/catalog">
                <GlassButton>Back to Catalog</GlassButton>
            </Link>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#040407', color: 'white', padding: '100px 20px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <Link to="/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: '40px' }}>
                    <ArrowLeft size={16} /> Back to Catalog
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '48px', alignItems: 'start' }}>
                    {/* Left Sidebar: Profile Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <GlassCard heavy style={{ padding: '40px', textAlign: 'center' }}>
                            <div style={{ width: '160px', height: '160px', margin: '0 auto 24px', borderRadius: '40px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {instructor.picture ? (
                                    <img src={instructor.picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <UserIcon size={64} color="white" />
                                )}
                            </div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>{instructor.name}</h1>
                            <p style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {instructor.title || 'Expert Instructor'}
                            </p>
                            
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                    <Globe size={18} color="rgba(255,255,255,0.4)" />
                                </div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                    <Linkedin size={18} color="rgba(255,255,255,0.4)" />
                                </div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                    <Mail size={18} color="rgba(255,255,255,0.4)" />
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Total Courses</span>
                                    <span style={{ fontWeight: 800 }}>{courses.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Students</span>
                                    <span style={{ fontWeight: 800 }}>12.4k+</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Reviews</span>
                                    <span style={{ fontWeight: 800 }}>1,204</span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Right Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                        <section>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <UserIcon size={24} color="var(--accent-blue)" /> About Me
                            </h2>
                            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                                {instructor.bio || "This instructor is part of the KLS Tech Campus Faculty, dedicated to providing high-quality technical education."}
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Briefcase size={24} color="var(--accent-purple)" /> Professional Experience
                            </h2>
                            <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                {instructor.experience || "Experience details are being finalized. Check back soon for full professional history."}
                            </div>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Book size={24} color="#30D158" /> Courses by {instructor.name}
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {courses.map(course => (
                                    <GlassCard key={course.id} style={{ padding: '0', overflow: 'hidden' }}>
                                        <div style={{ height: '140px', background: course.thumbnail ? `url(${course.thumbnail}) center/cover` : 'rgba(255,255,255,0.05)' }} />
                                        <div style={{ padding: '20px' }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>{course.title}</h4>
                                            <Link to={`/course/${course.id}`} style={{ textDecoration: 'none' }}>
                                                <GlassButton style={{ width: '100%', fontSize: '0.8rem' }}>View Course</GlassButton>
                                            </Link>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorProfilePage;
