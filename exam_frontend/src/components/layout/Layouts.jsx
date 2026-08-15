import React, { useState, useContext, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { FiLogOut, FiBook, FiClock, FiCheckSquare, FiUser, FiActivity } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import { courseService } from '../../services/courses';
import { motion, useMotionValue, useTransform, useMotionTemplate, animate } from 'framer-motion';
import './layouts.css';

export const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <Outlet />
      </div>
    </div>
  );
};

const BottomNav = ({ items, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const itemRefs = useRef({});
  
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragX = useMotionValue(0);

  const activeIndex = items.findIndex(item => location.pathname.startsWith(item.path));
  const activePath = items[activeIndex]?.path;
  const initialLoadRef = useRef(true);
  const pendingRouteRef = useRef(null);

  // Calculate target X position with exact bounding rects to prevent misalignment
  const getTargetX = (path) => {
    if (!path || !itemRefs.current[path] || !containerRef.current) return null;
    const el = itemRefs.current[path];
    const container = containerRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    
    // Exact center relative to the container
    return elRect.left - containerRect.left + (elRect.width / 2);
  };

  // State to track the icon currently displayed in the bubble
  const [bubblePath, setBubblePath] = useState(activePath);

  // Clear pending route when we actually arrive there
  useEffect(() => {
    if (pendingRouteRef.current === activePath) {
      pendingRouteRef.current = null;
    }
  }, [activePath]);

  // Sync routing and bubble positioning
  useEffect(() => {
    // If we are currently dragging, OR we are waiting for a route change we initiated, don't force snap back to activePath
    if (isDraggingRef.current || pendingRouteRef.current || !activePath) return;

    setBubblePath(activePath);

    const targetX = getTargetX(activePath);
    if (targetX !== null) {
      if (initialLoadRef.current) {
        // Instant jump on initial load to avoid traveling from 0
        dragX.jump(targetX);
        initialLoadRef.current = false;
      } else {
        // Animate directly to the destination
        animate(dragX, targetX, {
          type: "tween",
          duration: 0.35, // Smooth direct travel
          ease: "easeInOut"
        });
      }
    }
  }, [activePath, dragX, items]);

  // Handle window resizing to keep the bubble perfectly centered
  useEffect(() => {
    const handleResize = () => {
      if (!isDraggingRef.current && activePath) {
        const targetX = getTargetX(activePath);
        if (targetX !== null) {
          dragX.jump(targetX);
        }
      }
    };
    
    // ResizeObserver tracks dynamic width changes better than window resize
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [activePath, dragX]);

  // Handle Dragging Handoff Logic
  useEffect(() => {
    return dragX.on('change', (latest) => {
      if (!isDraggingRef.current) return; // Only do handoff while physically dragging
      
      let closestPath = null;
      let minDistance = Infinity;

      items.forEach(item => {
        const targetX = getTargetX(item.path);
        if (targetX !== null) {
          const dist = Math.abs(latest - targetX);
          if (dist < minDistance) {
            minDistance = dist;
            closestPath = item.path;
          }
        }
      });
      
      const logoutTargetX = getTargetX('logout');
      if (logoutTargetX !== null) {
        const dist = Math.abs(latest - logoutTargetX);
        if (dist < minDistance) {
          minDistance = dist;
          closestPath = 'logout';
        }
      }

      if (closestPath) {
        setBubblePath(closestPath);
      }
    });
  }, [dragX, items]);

  const handlePointerDown = (e) => {
    if (!containerRef.current) return;
    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    dragStartX.current = e.clientX;
  };

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    
    // Safety check: if pointer is moving but no mouse buttons are pressed, we are NOT dragging.
    // e.buttons === 0 means no buttons are held. (e.pointerType === 'mouse' prevents touch issues)
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      if (isPointerDownRef.current) {
        handlePointerUp(e);
      }
      return;
    }

    if (!isPointerDownRef.current) return;
    
    if (!isDraggingRef.current) {
      // Threshold of 5px to distinguish between click and drag
      if (Math.abs(e.clientX - dragStartX.current) > 5) {
        isDraggingRef.current = true;
        setIsDragging(true);
        try {
          containerRef.current.setPointerCapture(e.pointerId);
        } catch (err) {}
      } else {
        return;
      }
    }
    
    const containerLeft = containerRef.current.getBoundingClientRect().left;
    dragX.set(e.clientX - containerLeft);
  };

  const handlePointerUp = (e) => {
    isPointerDownRef.current = false;
    
    if (isDraggingRef.current && containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    
    if (!isDraggingRef.current) {
      // It was just a click. Handle it here because touchAction: 'none' may suppress native clicks
      const clickedItemEl = e.target.closest('.bottom-nav-item');
      if (clickedItemEl) {
        const clickedPath = Object.keys(itemRefs.current).find(path => itemRefs.current[path] === clickedItemEl);
        if (clickedPath) {
          if (clickedPath === 'logout') {
            pendingRouteRef.current = 'logout';
            setBubblePath('logout');
            const targetX = getTargetX('logout');
            if (targetX !== null) animate(dragX, targetX, { type: "tween", duration: 0.35, ease: "easeInOut" });
            onLogout();
          } else {
            pendingRouteRef.current = clickedPath;
            setBubblePath(clickedPath);
            const targetX = getTargetX(clickedPath);
            if (targetX !== null) animate(dragX, targetX, { type: "tween", duration: 0.35, ease: "easeInOut" });
            if (!location.pathname.startsWith(clickedPath)) {
              navigate(clickedPath);
            }
          }
        }
      }
      return;
    }
    
    isDraggingRef.current = false;
    setIsDragging(false);
    
    if (bubblePath) {
      const targetX = getTargetX(bubblePath);
      if (targetX !== null) {
        animate(dragX, targetX, { type: "tween", duration: 0.2, ease: "easeOut" });
      }
      
      if (bubblePath === 'logout') {
        onLogout();
      } else if (!location.pathname.startsWith(bubblePath)) {
        pendingRouteRef.current = bubblePath;
        navigate(bubblePath);
      }
    }
  };

  // Create a mask with a transparent hole matching the bubble size (approx 65px width)
  const maskStyle = useMotionTemplate`radial-gradient(circle 42px at ${dragX}px -8px, transparent 100%, black 100%)`;

  // Which icon should the floating bubble render?
  let NearestIcon = null;
  if (bubblePath === 'logout') {
    NearestIcon = FiLogOut;
  } else {
    const nearestItem = items.find(i => i.path === bubblePath);
    if (nearestItem) NearestIcon = nearestItem.icon;
  }

  return (
    <div className="bottom-nav-wrapper">
      <nav 
        className="bottom-nav-container"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }} 
      >
        {/* 1. Main Glass Background with Cutout Hole */}
        <motion.div 
          className="nav-glass-background"
          style={{
            WebkitMaskImage: maskStyle,
            maskImage: maskStyle,
          }}
        />

        {/* 2. Luminous Cutout Rim (creates the physical glass edge of the hole) */}
        <motion.div 
          className="nav-cutout-rim"
          style={{ x: dragX }}
        />

        {/* 3. Floating Active Bubble */}
        <motion.div 
          className="floating-active-bubble"
          style={{ x: dragX }}
        >
          {NearestIcon && <NearestIcon size={24} className="active-bubble-icon" />}
        </motion.div>

        {/* 4. The static navigation items container */}
        <div className="nav-items-container">
          {items.map(item => {
            const isNearest = bubblePath === item.path;
            const Icon = item.icon;
            
            return (
              <div 
                key={item.path}
                className={`bottom-nav-item ${isNearest ? 'nearest' : ''}`}
                ref={el => itemRefs.current[item.path] = el}
              >
                <div className="nav-icon-container" style={{ opacity: isNearest ? 0 : 0.6 }}>
                  <Icon size={22} className="nav-icon" />
                </div>
                <span className="nav-label" style={{ 
                  opacity: isNearest ? 1 : 0, 
                  transform: isNearest ? 'translateY(0)' : 'translateY(10px)' 
                }}>
                  {item.label}
                </span>
              </div>
            );
          })}
          
          <div 
            className={`bottom-nav-item logout-btn ${bubblePath === 'logout' ? 'nearest' : ''}`} 
            ref={el => itemRefs.current['logout'] = el}
            title="Logout"
          >
            <div className="nav-icon-container" style={{ opacity: bubblePath === 'logout' ? 0 : 0.8, color: 'var(--color-danger)' }}>
              <FiLogOut size={22} className="nav-icon" />
            </div>
            <span className="nav-label" style={{ 
                  opacity: bubblePath === 'logout' ? 1 : 0, 
                  transform: bubblePath === 'logout' ? 'translateY(0)' : 'translateY(10px)',
                  color: 'var(--color-danger)'
            }}>
              Logout
            </span>
          </div>
        </div>
      </nav>
    </div>
  );
};

export const StudentLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/student/exams', icon: FiActivity, label: 'Exams' },
    { path: '/student/courses', icon: FiBook, label: 'Courses' },
    { path: '/student/results', icon: FiCheckSquare, label: 'Results' },
    { path: '/student/profile', icon: FiUser, label: 'Profile' }
  ];

  return (
    <div className="app-layout">
      <main className="content-area floating-nav-padding">
        <Outlet />
      </main>
      <BottomNav items={navItems} onLogout={handleLogout} />
    </div>
  );
};

export const InstructorLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/instructor/exams', icon: FiActivity, label: 'Dashboard' },
    { path: '/instructor/create', icon: FiCheckSquare, label: 'Create' },
    { path: '/instructor/courses', icon: FiBook, label: 'Courses' },
    { path: '/instructor/profile', icon: FiUser, label: 'Profile' }
  ];

  return (
    <div className="app-layout">
      <main className="content-area floating-nav-padding">
        <Outlet />
      </main>
      <BottomNav items={navItems} onLogout={handleLogout} />
    </div>
  );
};
