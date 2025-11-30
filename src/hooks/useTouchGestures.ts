'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  direction: SwipeDirection;
  distance: number;
  velocity: number;
  isSwiping: boolean;
}

interface TouchGestureOptions {
  /** Minimum distance to trigger a swipe (in pixels) */
  threshold?: number;
  /** Minimum velocity to trigger a swipe (pixels per ms) */
  velocityThreshold?: number;
  /** Prevent default touch behavior */
  preventDefault?: boolean;
  /** Enable/disable gesture detection */
  enabled?: boolean;
  /** Callback when swipe left */
  onSwipeLeft?: (state: SwipeState) => void;
  /** Callback when swipe right */
  onSwipeRight?: (state: SwipeState) => void;
  /** Callback when swipe up */
  onSwipeUp?: (state: SwipeState) => void;
  /** Callback when swipe down */
  onSwipeDown?: (state: SwipeState) => void;
  /** Callback for any swipe */
  onSwipe?: (direction: SwipeDirection, state: SwipeState) => void;
  /** Callback during swipe (for animations) */
  onSwiping?: (state: SwipeState) => void;
  /** Callback when swipe ends */
  onSwipeEnd?: (state: SwipeState) => void;
}

const initialState: SwipeState = {
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  direction: null,
  distance: 0,
  velocity: 0,
  isSwiping: false,
};

/**
 * Hook for detecting touch/swipe gestures
 * Useful for mobile navigation, card swiping, etc.
 */
export function useTouchGestures<T extends HTMLElement = HTMLElement>(
  options: TouchGestureOptions = {}
) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    preventDefault = false,
    enabled = true,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipe,
    onSwiping,
    onSwipeEnd,
  } = options;

  const ref = useRef<T>(null);
  const startTimeRef = useRef<number>(0);
  const [swipeState, setSwipeState] = useState<SwipeState>(initialState);

  const getDirection = useCallback(
    (deltaX: number, deltaY: number): SwipeDirection => {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < threshold && absY < threshold) return null;

      if (absX > absY) {
        return deltaX > 0 ? 'right' : 'left';
      } else {
        return deltaY > 0 ? 'down' : 'up';
      }
    },
    [threshold]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      startTimeRef.current = Date.now();

      setSwipeState({
        startX: touch.clientX,
        startY: touch.clientY,
        endX: touch.clientX,
        endY: touch.clientY,
        direction: null,
        distance: 0,
        velocity: 0,
        isSwiping: true,
      });
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !swipeState.isSwiping) return;

      if (preventDefault) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeState.startX;
      const deltaY = touch.clientY - swipeState.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const direction = getDirection(deltaX, deltaY);
      const elapsed = Date.now() - startTimeRef.current;
      const velocity = distance / (elapsed || 1);

      const newState: SwipeState = {
        ...swipeState,
        endX: touch.clientX,
        endY: touch.clientY,
        direction,
        distance,
        velocity,
      };

      setSwipeState(newState);
      onSwiping?.(newState);
    },
    [enabled, swipeState, getDirection, preventDefault, onSwiping]
  );

  const handleTouchEnd = useCallback(
    (_e: TouchEvent) => {
      if (!enabled || !swipeState.isSwiping) return;

      const elapsed = Date.now() - startTimeRef.current;
      const velocity = swipeState.distance / (elapsed || 1);
      const meetsThreshold = 
        swipeState.distance >= threshold || velocity >= velocityThreshold;

      const finalState: SwipeState = {
        ...swipeState,
        velocity,
        isSwiping: false,
      };

      setSwipeState(finalState);

      if (meetsThreshold && finalState.direction) {
        onSwipe?.(finalState.direction, finalState);

        switch (finalState.direction) {
          case 'left':
            onSwipeLeft?.(finalState);
            break;
          case 'right':
            onSwipeRight?.(finalState);
            break;
          case 'up':
            onSwipeUp?.(finalState);
            break;
          case 'down':
            onSwipeDown?.(finalState);
            break;
        }
      }

      onSwipeEnd?.(finalState);
    },
    [
      enabled,
      swipeState,
      threshold,
      velocityThreshold,
      onSwipe,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onSwipeEnd,
    ]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  return {
    ref,
    swipeState,
    isSwiping: swipeState.isSwiping,
    direction: swipeState.direction,
  };
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(options: {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
}) {
  const { onRefresh, threshold = 80, enabled = true } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const { ref } = useTouchGestures<HTMLDivElement>({
    enabled: enabled && !isRefreshing,
    onSwiping: (state) => {
      // Only activate when at top of scroll container
      const element = ref.current;
      if (!element || element.scrollTop > 0) return;

      if (state.direction === 'down') {
        setPullDistance(Math.min(state.distance, threshold * 1.5));
      }
    },
    onSwipeEnd: async (state) => {
      if (state.direction === 'down' && pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setPullDistance(0);
    },
  });

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return {
    ref,
    isRefreshing,
    pullDistance,
    pullProgress,
  };
}

/**
 * Hook for detecting long press
 */
export function useLongPress(
  callback: () => void,
  options: {
    delay?: number;
    enabled?: boolean;
  } = {}
) {
  const { delay = 500, enabled = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const start = useCallback(() => {
    if (!enabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsLongPressing(true);
      callback();
    }, delay);
  }, [callback, delay, enabled]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLongPressing(false);
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    isLongPressing,
  };
}
