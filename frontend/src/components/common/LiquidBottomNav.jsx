import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useMotionTemplate, animate, AnimatePresence } from 'framer-motion';
import { LogOut, MoreHorizontal } from 'lucide-react';
import './liquid-nav.css';

/**
 * LiquidBottomNav
 * 
 * Props:
 * - items: Array of objects { label, path, icon, end }
 * - onLogout: Function to handle logout
 */
export const LiquidBottomNav = ({ items, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const itemRefs = useRef({});
  
  const [maxVisible, setMaxVisible] = useState(items.length);

  useEffect(() => {
    const calculateVisibleItems = () => {
      if (!wrapperRef.current) return;
      const availableWidth = wrapperRef.current.clientWidth - 32; // 32px safe padding
      const ITEM_WIDTH = 75; // Approx width each item needs to be readable and tappable
      const possibleItems = Math.floor(availableWidth / ITEM_WIDTH);
      
      if (possibleItems >= items.length) {
        setMaxVisible(items.length);
      } else {
        setMaxVisible(Math.max(1, possibleItems - 1)); // Leave 1 slot for More
      }
    };

    calculateVisibleItems();
    const observer = new ResizeObserver(calculateVisibleItems);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    
    return () => observer.disconnect();
  }, [items.length]);

  const visibleItems = items.slice(0, maxVisible);
  const moreItems = items.slice(maxVisible);

  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const wasDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragX = useMotionValue(0);

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [dragTitle, setDragTitle] = useState('');

  // Determine active paths
  // Support matching base paths for nested routes
  const isItemActive = (itemPath, currentPath, exact = false) => {
    if (itemPath === '/admin' && currentPath !== '/admin') return false;
    if (itemPath === '/teacher' && currentPath !== '/teacher') return false;
    if (exact) return currentPath === itemPath;
    return currentPath.startsWith(itemPath);
  };

  const getActiveItemInfo = () => {
    const current = location.pathname;
    
    // Check visible items first
    for (const item of visibleItems) {
      if (isItemActive(item.path, current, item.end)) {
        return { path: item.path, isMore: false, label: item.label };
      }
    }
    
    // Check more items
    for (const item of moreItems) {
      if (isItemActive(item.path, current, item.end)) {
        return { path: 'more', isMore: true, label: item.label }; // Bubble stays on "More"
      }
    }
    
    // Default fallback to first item
    return { path: visibleItems[0]?.path, isMore: false, label: visibleItems[0]?.label };
  };

  const activeInfo = getActiveItemInfo();
  
  const initialLoadRef = useRef(true);
  const [bubblePath, setBubblePath] = useState(activeInfo.isMore ? 'more' : activeInfo.path);

  // Add the "More" button to visible items for layout
  const renderedVisibleItems = [...visibleItems];
  if (moreItems.length > 0) {
    renderedVisibleItems.push({ label: 'More', path: 'more', icon: MoreHorizontal });
  }

  // Calculate target X position with exact bounding rects
  const getTargetX = (path) => {
    if (!path || !itemRefs.current[path] || !containerRef.current) return null;
    const el = itemRefs.current[path];
    const container = containerRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    
    // Exact center relative to the container
    return elRect.left - containerRect.left + (elRect.width / 2);
  };

  // Sync routing and bubble positioning
  useEffect(() => {
    // If dragging or if the More menu is manually open, do not snap back to URL state
    if (isDraggingRef.current || showMoreMenu) return;

    const targetPath = activeInfo.isMore ? 'more' : activeInfo.path;
    
    if (targetPath) {
      setBubblePath(targetPath);
      
      const targetX = getTargetX(targetPath);
      if (targetX !== null) {
        if (initialLoadRef.current) {
          dragX.jump(targetX);
          initialLoadRef.current = false;
        } else {
          animate(dragX, targetX, {
            type: "tween",
            duration: 0.35, 
            ease: "easeInOut"
          });
        }
      }
    }
  }, [activeInfo.path, activeInfo.isMore, dragX, renderedVisibleItems, showMoreMenu]);

  // Handle window resizing to keep bubble centered
  useEffect(() => {
    const handleResize = () => {
      if (!isDraggingRef.current) {
        const targetPath = (showMoreMenu || activeInfo.isMore) ? 'more' : activeInfo.path;
        const targetX = getTargetX(targetPath);
        if (targetX !== null) {
          dragX.jump(targetX);
        }
      }
    };
    
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [activeInfo.path, activeInfo.isMore, showMoreMenu, dragX]);

  // Handle Dragging Handoff Logic
  useEffect(() => {
    return dragX.on('change', (latest) => {
      if (!isDraggingRef.current) return;
      
      let closestPath = null;
      let minDistance = Infinity;
      let closestLabel = '';

      renderedVisibleItems.forEach(item => {
        const targetX = getTargetX(item.path);
        if (targetX !== null) {
          const dist = Math.abs(latest - targetX);
          if (dist < minDistance) {
            minDistance = dist;
            closestPath = item.path;
            closestLabel = item.label;
          }
        }
      });

      if (closestPath) {
        setBubblePath(closestPath);
        setDragTitle(closestLabel);
      }
    });
  }, [dragX, renderedVisibleItems]);

  const handlePointerDown = (e) => {
    if (!containerRef.current) return;
    
    // Don't intercept clicks inside the more menu container
    if (e.target.closest('.more-menu-container')) return;
    
    // Close more menu if interacting with main bar
    setShowMoreMenu(false);
    
    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    dragStartX.current = e.clientX;
  };

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    
    // Safety check for missed pointerups (e.g. hovered without holding)
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      if (isPointerDownRef.current) {
        handlePointerUp(e);
      }
      return;
    }

    if (!isPointerDownRef.current) return;
    
    if (!isDraggingRef.current) {
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
    let newX = e.clientX - containerLeft;
    
    // Optional clamp:
    const containerWidth = containerRef.current.offsetWidth;
    newX = Math.max(20, Math.min(newX, containerWidth - 20));
    
    dragX.set(newX);
  };

  const handlePointerUp = (e) => {
    isPointerDownRef.current = false;
    
    if (isDraggingRef.current && containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    
    if (isDraggingRef.current) {
      // Finished dragging
      wasDraggingRef.current = true;
      isDraggingRef.current = false;
      setIsDragging(false);
      
      if (bubblePath) {
        executeNavigation(bubblePath);
      }

      // Reset wasDragging state shortly after release to unblock normal clicks
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 50);
    }
  };

  const handleItemClick = (e, path) => {
    // If a drag just finished, suppress this secondary click event
    if (isDraggingRef.current || wasDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Normal click navigation
    executeNavigation(path);
  };

  const executeNavigation = (path) => {
    if (path === 'logout') {
      if (onLogout) onLogout();
      return;
    }
    
    if (path === 'more') {
      setBubblePath('more'); // Optmistically set active
      const targetX = getTargetX('more');
      if (targetX !== null) {
        animate(dragX, targetX, { type: "tween", duration: 0.2, ease: "easeOut" }).then(() => {
          setShowMoreMenu(true);
        });
      }
    } else if (path && path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer');
      // Force bubble to snap back to the actual current route since we aren't navigating internally
      const currentActive = getActiveItemInfo();
      setBubblePath(currentActive.isMore ? 'more' : currentActive.path);
    } else if (path) {
      if (location.pathname !== path) {
        navigate(path);
      }
    }
  };

  const handleMoreItemClick = (e, path) => {
    // Prevent drag events from capturing this
    e.stopPropagation();
    setShowMoreMenu(false);
    if (path === 'logout') {
      onLogout();
    } else if (path && path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      if (location.pathname !== path) {
        navigate(path);
      }
    }
  };

  // Close More menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showMoreMenu) {
        setShowMoreMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMoreMenu]);

  const maskStyle = useMotionTemplate`radial-gradient(circle 42px at ${dragX}px -8px, transparent 100%, black 100%)`;

  let NearestIcon = null;
  const nearestItem = renderedVisibleItems.find(i => i.path === bubblePath);
  if (nearestItem) NearestIcon = nearestItem.icon;

  // Title popup clamping
  const popupX = useMotionTemplate`calc(${dragX}px - 50%)`;

  return (
    <>
      <div className="bottom-nav-wrapper" ref={wrapperRef}>
        
        <nav 
          className="bottom-nav-container"
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Drag Title Popup */}
          <AnimatePresence>
            {isDragging && dragTitle && (
              <motion.div 
                className="drag-title-popup"
                style={{ left: dragX, x: "-50%" }}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {dragTitle}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div 
            className="nav-glass-background"
            style={{ WebkitMaskImage: maskStyle, maskImage: maskStyle }}
          />

          <motion.div className="nav-cutout-rim" style={{ x: dragX }} />

          <motion.div className="floating-active-bubble" style={{ x: dragX }}>
            {NearestIcon && <NearestIcon size={24} className="active-bubble-icon" />}
          </motion.div>

          <div className="nav-items-container">
            {renderedVisibleItems.map(item => {
              const isNearest = bubblePath === item.path;
              const Icon = item.icon;
              
              return (
                <div 
                  key={item.path}
                  className={`bottom-nav-item ${isNearest ? 'nearest' : ''}`}
                  ref={el => itemRefs.current[item.path] = el}
                  data-path={item.path}
                  onClickCapture={(e) => handleItemClick(e, item.path)}
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
          </div>
          {/* More Menu Popover */}
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div 
                className="more-menu-container"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {moreItems.map(item => {
                  const isItemActiveInMore = item.path !== 'logout' && isItemActive(item.path, location.pathname, item.end);
                  const isLogout = item.path === 'logout';
                  const Icon = item.icon || (isLogout ? LogOut : null);
                  
                  return (
                    <button
                      key={item.path}
                      className={`more-menu-item ${isItemActiveInMore ? 'active' : ''} ${isLogout ? 'logout' : ''}`}
                      onClick={(e) => handleMoreItemClick(e, item.path)}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {Icon && (
                        <span className="icon-wrapper">
                          <Icon size={18} />
                        </span>
                      )}
                      {item.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
      
      {/* Invisible overlay to close more menu when clicking outside */}
      {showMoreMenu && (
        <div 
          className="more-menu-overlay"
          onClick={() => setShowMoreMenu(false)}
        />
      )}
    </>
  );
};
