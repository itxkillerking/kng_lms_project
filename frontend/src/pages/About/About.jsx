import React from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { Users, Target, Rocket, ShieldCheck, Mail, Cpu, Smartphone, Brain, Layers, ArrowLeft, Quote } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';

const About = () => {
    const isMobile = window.innerWidth <= 1024;
    const navigate = useNavigate();

    const sections = [
        {
            icon: Users,
            title: "Who We Are",
            content: "Welcome to KLS Tech Campus (A project of KNG Logics Solutions). We are a fast-growing tech startup built on a single, powerful idea: education should be clear, professional, and accessible to everyone. Led by our CEO, Jawad Ahmed, we focus on building optimized, consistent, and top-tier systems that solve real-world problems."
        },
        {
            icon: Target,
            title: "The Problem We Are Solving",
            content: "We know that learning new tech skills can be frustrating.",
            subPoints: [
                {
                    label: "The YouTube Trap",
                    text: "Learning from YouTube is often messy. There is no clear path, too many distractions, and no structured guidance. Students get confused and give up."
                },
                {
                    label: "The Access Gap",
                    text: "High-quality, professional skills are often locked behind very expensive courses. Many talented people simply cannot get the help they need."
                }
            ]
        },
        {
            icon: Rocket,
            title: "Our Mission and Goal",
            content: "At KLS Tech Campus, we are here to change how you learn. Our main goals are:",
            goals: [
                "Give Free Knowledge: We provide high-level, industry-ready education at no cost, so money is never a block to your success.",
                "Provide Clear Paths: We offer step-by-step, organized courses. No more guessing what video to watch next.",
                "Build Real Skills: We focus on teaching actual skills that the tech industry needs right now, like AI, Machine Learning, Web Development, and App Development."
            ]
        },
        {
            icon: ShieldCheck,
            title: "Why Choose Us?",
            content: "We do not build basic student work; we build professional systems. When you learn with KLS Tech Campus, you are learning inside a platform designed for the future. We treat our learners like future professionals, giving you the exact tools you need to succeed in the real market."
        }
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#040407', color: 'white', padding: isMobile ? '120px 20px 80px' : '160px 60px 120px' }}>
            {/* Background Architecture */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '10%', right: '5%', width: '600px', height: '600px', background: 'rgba(10, 132, 255, 0.08)', filter: 'blur(150px)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: '500px', height: '500px', background: 'rgba(191, 90, 242, 0.08)', filter: 'blur(150px)', borderRadius: '50%' }} />
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                
                {/* Back Button */}
                <div style={{ marginBottom: '40px' }}>
                    <GlassButton 
                        onClick={() => navigate(-1)} 
                        style={{ 
                            borderRadius: '12px', 
                            padding: '8px 16px', 
                            fontSize: '0.85rem', 
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}
                    >
                        <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Go Back
                    </GlassButton>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h1 style={{ fontSize: isMobile ? '2.8rem' : '4.5rem', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '28px' }}>
                        Changing the Way <br />
                        <span style={{ background: 'linear-gradient(to right, #0A84FF, #BF5AF2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Knowledge is Delivered</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.4)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                        KLS Tech Campus is the elite standard for future professionals, bridging the gap between confusion and mastery.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {sections.map((section, idx) => (
                        <GlassCard key={idx} style={{ padding: isMobile ? '32px 24px' : '48px', borderRadius: '40px' }}>
                            <div style={{ display: 'flex', gap: '32px', flexDirection: isMobile ? 'column' : 'row' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(10, 132, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <section.icon size={30} color="#0A84FF" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 850, marginBottom: '24px', letterSpacing: '-0.02em' }}>{section.title}</h2>
                                    <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.9, marginBottom: section.subPoints || section.goals ? '32px' : '0' }}>
                                        {section.content}
                                    </p>

                                    {section.subPoints && (
                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                                            {section.subPoints.map((point, i) => (
                                                <div key={i} style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <h4 style={{ fontWeight: 800, color: 'white', marginBottom: '12px', fontSize: '1rem' }}>{point.label}</h4>
                                                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{point.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {section.goals && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {section.goals.map((goal, i) => (
                                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(48, 209, 88, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px', flexShrink: 0 }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#30D158' }} />
                                                    </div>
                                                    <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                                                        <strong>{goal.split(':')[0]}:</strong>{goal.split(':')[1]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Team / Founder Section */}
                <div style={{ 
                    marginTop: '120px', 
                    paddingBottom: '120px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '32px'
                }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ 
                            width: '140px', 
                            height: '140px', 
                            borderRadius: '48px', 
                            background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '3.5rem', 
                            fontWeight: 900,
                            boxShadow: '0 20px 40px rgba(10, 132, 255, 0.2)'
                        }}>J</div>
                        <div style={{ 
                            position: 'absolute', 
                            bottom: '10px', 
                            right: '5px', 
                            width: '36px', 
                            height: '36px', 
                            background: '#040407',
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ 
                                width: '20px', 
                                height: '20px', 
                                background: '#30D158', 
                                borderRadius: '50%',
                                boxShadow: '0 0 15px rgba(48, 209, 88, 0.5)'
                            }} />
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.02em' }}>Jawad Ahmed</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>CEO & FOUNDER</p>
                        <p style={{ color: '#0A84FF', fontSize: '0.8rem', fontWeight: 800, marginTop: '4px', letterSpacing: '0.1em' }}>KLS TECH CAMPUS</p>
                    </div>

                    <div style={{ maxWidth: '600px', position: 'relative', marginTop: '10px' }}>
                        <Quote size={40} color="rgba(10, 132, 255, 0.15)" style={{ position: 'absolute', top: -15, left: -25 }} />
                        <p style={{ 
                            fontSize: '1.2rem', 
                            lineHeight: 1.8, 
                            color: 'rgba(255,255,255,0.6)', 
                            fontStyle: 'italic',
                            fontWeight: 500
                        }}>
                            "At KLS Tech Campus, we are not just building courses; we are building paths to professional independence. Every line of code our students write is a step toward their future."
                        </p>
                    </div>

                    <Link to="/register" style={{ marginTop: '16px' }}>
                        <GlassButton primary style={{ 
                            padding: '18px 48px', 
                            borderRadius: '20px', 
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            boxShadow: '0 10px 30px rgba(10, 132, 255, 0.3)'
                        }}>
                            Join Our Mission
                        </GlassButton>
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default About;
