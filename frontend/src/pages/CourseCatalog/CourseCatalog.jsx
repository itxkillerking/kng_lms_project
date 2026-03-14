import React, { useState, useMemo } from 'react';
import api from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { Search, Filter, Clock, Users, Star, Sparkles, ChevronRight, Loader, RefreshCw, X, ChevronDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const CourseCatalog = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTerm = searchParams.get('q') || '';
    const [page, setPage] = useState(1);
    const [allCourses, setAllCourses] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const sortMenuRef = React.useRef(null);
    const navigate = useNavigate();
    
    // Modern responsive handling
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth <= 1024;
    const isSmallMobile = windowWidth <= 480;

    React.useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle click outside for sort menu
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
                setShowSortMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const setSearchTerm = (val) => {
        if (val) {
            setSearchParams({ q: val }, { replace: true });
        } else {
            setSearchParams({}, { replace: true });
        }
        // Reset results when searching
        setAllCourses([]);
        setPage(1);
    };

    const handleCategoryClick = (catId) => {
        setSelectedCategory(catId === selectedCategory ? null : catId);
        setAllCourses([]);
        setPage(1);
    };

    // Fetch courses with React Query
    const { isLoading, isError, data, isFetching } = useQuery({
        queryKey: ['courses', page, searchTerm, selectedCategory],
        queryFn: async () => {
            let url = `courses/?page=${page}`;
            if (searchTerm) url += `&search=${searchTerm}`;
            if (selectedCategory) url += `&category=${selectedCategory}`;
            const response = await api.get(url);
            return response.data;
        },
        onSuccess: (newData) => {
            // Append new results to the end
            setAllCourses(prev => {
                const results = Array.isArray(newData) ? newData : newData.results || [];
                // Simple de-duplication
                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNew = results.filter(c => !existingIds.has(c.id));
                return [...prev, ...uniqueNew];
            });
        },
    });

    // In case onSuccess isn't available in newer TanStack Query versions or preferred as separate effect
    React.useEffect(() => {
        if (data) {
            const results = Array.isArray(data) ? data : data.results || [];
            setAllCourses(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNew = results.filter(c => !existingIds.has(c.id));
                return [...prev, ...uniqueNew];
            });
        }
    }, [data]);

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('categories/');
            return Array.isArray(res.data) ? res.data : res.data.results || [];
        }
    });

    const filteredCourses = useMemo(() => {
        let filtered = allCourses.filter(course =>
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Apply Sorting
        return filtered.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'price_low') return a.price - b.price;
            if (sortBy === 'price_high') return b.price - a.price;
            if (sortBy === 'rating') return b.average_rating - a.average_rating;
            return 0;
        });
    }, [allCourses, searchTerm, sortBy]);

    const hasMore = data && !Array.isArray(data) && data.next !== null;

    if (isLoading && page === 1) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#040407', gap: '20px' }}>
                <Loader className="animate-spin" size={48} color="#0A84FF" />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>Loading curated tracks...</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', padding: isMobile ? '100px 20px 40px' : '60px 40px', maxWidth: '1400px', margin: '0 auto', color: 'white' }}>
            
            {/* Header Area */}
            <div style={{ marginBottom: '80px', textAlign: isMobile ? 'left' : 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(10, 132, 255, 0.1)', borderRadius: '100px', color: '#0A84FF', fontSize: '0.75rem', fontWeight: 800, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <Sparkles size={14} /> Professional Academy
                </div>
                <h1 style={{ fontSize: isMobile ? '2.2rem' : '3.8rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.04em' }}>
                    Master the <span style={{ color: '#0A84FF' }}>Modern Stack</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: isSmallMobile ? '0.95rem' : '1.15rem', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                    Specialized career tracks designed for scaling real-world systems. 
                    From Python Fundamentals to Enterprise AI.
                </p>
            </div>

            {/* Categories Bar */}
            <div style={{ 
                display: 'flex', 
                gap: isSmallMobile ? '8px' : '16px', 
                overflowX: 'auto', 
                padding: '12px 10px 24px 10px', 
                marginBottom: isSmallMobile ? '32px' : '60px', 
                scrollbarWidth: 'none', 
                WebkitOverflowScrolling: 'touch',
                maskImage: isSmallMobile ? 'none' : 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
            }}>
                <GlassButton 
                    onClick={() => handleCategoryClick(null)}
                    style={{ 
                        borderRadius: '100px', 
                        whiteSpace: 'nowrap', 
                        background: selectedCategory === null ? 'rgba(10, 132, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)', 
                        color: selectedCategory === null ? '#0A84FF' : 'rgba(255, 255, 255, 0.6)', 
                        borderColor: selectedCategory === null ? 'rgba(10, 132, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)'
                    }}
                >
                    All Tracks
                </GlassButton>
                {categoriesData?.map(cat => (
                    <GlassButton 
                        key={cat.id} 
                        onClick={() => handleCategoryClick(cat.id)}
                        style={{ 
                            borderRadius: '100px', 
                            whiteSpace: 'nowrap',
                            background: selectedCategory === cat.id ? 'rgba(10, 132, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)', 
                            color: selectedCategory === cat.id ? '#0A84FF' : 'rgba(255, 255, 255, 0.6)', 
                            borderColor: selectedCategory === cat.id ? 'rgba(10, 132, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        {cat.name}
                    </GlassButton>
                ))}
            </div>

            {/* Enhanced Search & Filter */}
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: '20px', 
                marginBottom: '60px',
                alignItems: isMobile ? 'stretch' : 'center',
                background: 'rgba(255,255,255,0.02)',
                padding: '12px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={22} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" 
                        placeholder="Search by topic, skill, or instructor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '18px 20px 18px 60px',
                            color: 'white',
                            fontSize: '1.05rem',
                            outline: 'none',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '12px', position: 'relative' }} ref={sortMenuRef}>
                    <GlassButton 
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        style={{ 
                            borderRadius: '14px', 
                            background: showSortMenu ? 'rgba(10, 132, 255, 0.1)' : 'rgba(255,255,255,0.03)', 
                            border: showSortMenu ? '1px solid #0A84FF' : '1px solid rgba(255,255,255,0.08)',
                            color: showSortMenu ? '#0A84FF' : 'white',
                            minWidth: '130px'
                        }}
                    >
                        <Filter size={18} /> 
                        <span style={{ marginLeft: '8px', marginRight: '4px' }}>
                            {sortBy === 'newest' ? 'Newest' : sortBy === 'price_low' ? 'Price Low' : sortBy === 'price_high' ? 'Price High' : 'Top Rated'}
                        </span>
                        <ChevronDown size={14} style={{ transform: showSortMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </GlassButton>

                    {/* Sort Dropdown */}
                    {showSortMenu && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 10px)',
                            right: 0,
                            width: '200px',
                            background: 'rgba(15, 15, 25, 0.95)',
                            backdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '18px',
                            padding: '8px',
                            zIndex: 2000,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                        }}>
                            {[
                                { id: 'newest', label: 'Newest Arrivals' },
                                { id: 'rating', label: 'Top Rated' },
                                { id: 'price_low', label: 'Price: Low to High' },
                                { id: 'price_high', label: 'Price: High to Low' }
                            ].map(option => (
                                <div 
                                    key={option.id}
                                    onClick={() => {
                                        setSortBy(option.id);
                                        setShowSortMenu(false);
                                    }}
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        background: sortBy === option.id ? 'rgba(10, 132, 255, 0.1)' : 'transparent',
                                        color: sortBy === option.id ? '#0A84FF' : 'rgba(255,255,255,0.7)',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        if(sortBy !== option.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    }}
                                    onMouseLeave={e => {
                                        if(sortBy !== option.id) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {option.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Layout (Deep Improvement Cards) */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(auto-fill, minmax(${isSmallMobile ? '100%' : '320px'}, 1fr))`, 
                gap: isSmallMobile ? '20px' : '32px' 
            }}>
                {filteredCourses.map(course => (
                    <GlassCard key={course.id} style={{ 
                        borderRadius: '32px', 
                        overflow: 'hidden',
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-12px)';
                            e.currentTarget.style.borderColor = 'rgba(10, 132, 255, 0.2)';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {/* Visual Header */}
                        <div style={{ 
                            width: '100%', 
                            aspectRatio: '16/10', 
                            background: 'linear-gradient(135deg, rgba(10, 132, 254, 0.1), rgba(191, 90, 242, 0.1))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}>
                            <img 
                                src={course.thumbnail} 
                                alt="" 
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<div style="font-size: 3rem; opacity: 0.1">⚡</div>';
                                }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            
                            {/* Badges Overlay */}
                            <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '8px' }}>
                                <div style={{ padding: '6px 14px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {course.category_name || 'TECHNOLOGY'}
                                </div>
                                <div style={{ padding: '6px 14px', background: 'rgba(10, 132, 255, 0.9)', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, color: 'white' }}>
                                    NEW
                                </div>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'white', lineHeight: 1.3 }}>{course.title}</h3>
                            </div>
                            
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6, height: '3.2rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {course.description || "In-depth technical training focused on production-ready systems and scalable architecture."}
                            </p>

                            <div style={{ marginTop: 'auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> {Math.floor(course.total_duration_mins / 60)} Hours</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} /> {course.student_count || 0} Enrolled</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD60A' }}>
                                        <Star size={14} fill="#FFD60A" /> {course.average_rating || '4.9'}
                                    </div>
                                </div>

                                <GlassButton primary wide onClick={() => navigate(`/course/${course.id}`)} style={{ borderRadius: '16px', padding: '14px', fontSize: '0.95rem', fontWeight: 800 }}>
                                    Start Learning <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                                </GlassButton>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Pagination / Load More */}
            {hasMore && (
                <div style={{ marginTop: '60px', textAlign: 'center' }}>
                    <GlassButton 
                        onClick={() => setPage(p => p + 1)} 
                        disabled={isFetching}
                        style={{ 
                            padding: '16px 40px', 
                            borderRadius: '16px', 
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            gap: '12px'
                        }}
                    >
                        {isFetching ? (
                            <>
                                <RefreshCw className="animate-spin" size={18} />
                                <span>Loading more...</span>
                            </>
                        ) : (
                            <>
                                <span>Discover More Tracks</span>
                                <ChevronRight size={18} />
                            </>
                        )}
                    </GlassButton>
                </div>
            )}

            {isError && !allCourses.length && (
                <div style={{ textAlign: 'center', padding: '120px 20px' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <RefreshCw size={32} color="#ef4444" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Unable to load catalog</h3>
                    <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '32px' }}>Check your internet connection or try again later.</p>
                    <GlassButton primary onClick={() => window.location.reload()}>Retry Connection</GlassButton>
                </div>
            )}

            {filteredCourses.length === 0 && (
                <div style={{ textAlign: 'center', padding: '120px 20px' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Search size={32} color="rgba(255,255,255,0.1)" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>No matches found</h3>
                    <p style={{ color: 'rgba(255,255,255,0.3)' }}>Try adjusting your keywords to find related courses.</p>
                </div>
            )}
        </div>
    );
};

const ArrowRight = ({ size, style }) => <ChevronRight size={size} style={style} />;

export default CourseCatalog;
