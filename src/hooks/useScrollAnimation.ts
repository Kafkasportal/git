"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook for triggering animations when elements scroll into view
 * Uses Intersection Observer for 60fps+ performance
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options;
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref: elementRef, isVisible };
}

/**
 * Hook for staggered list animations
 */
export function useStaggerAnimation(_itemCount: number, baseDelay = 50) {
  const getDelay = useCallback(
    (index: number) => ({
      animationDelay: `${index * baseDelay}ms`,
    }),
    [baseDelay]
  );

  return { getDelay };
}

/**
 * Hook for page transition animations
 */
export function usePageTransition() {
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    // Mark as entered after mount
    const timer = setTimeout(() => setIsEntering(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return {
    className: isEntering ? "page-transition-wrapper" : "",
    isEntering,
  };
}

/**
 * Hook for smooth counter animations
 */
export function useCountAnimation(
  target: number,
  duration = 1000,
  startOnMount = true
) {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const animate = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const startTime = performance.now();
    const startValue = count;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);
      
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(step);
  }, [target, duration, count, isAnimating]);

  // Start animation on mount if requested
  const hasStarted = useRef(false);
  
  useEffect(() => {
    if (startOnMount && !hasStarted.current) {
      hasStarted.current = true;
      // Use requestAnimationFrame to avoid synchronous setState
      requestAnimationFrame(() => {
        animate();
      });
    }
  }, [startOnMount, animate]);

  return { count, animate, isAnimating };
}

export default useScrollAnimation;

