'use client';

/**
 * Session Tracking Module
 * Tracks user session duration, page views, and engagement metrics
 */

// Session data interface
interface SessionData {
  sessionId: string;
  startTime: number;
  lastActivityTime: number;
  pageViews: number;
  events: number;
  referrer: string;
  entryPage: string;
  exitPage: string;
  userId?: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

// Session metrics interface
export interface SessionMetrics {
  avgSessionDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  totalSessions: number;
  activeSessions: number;
}

// Storage key
const SESSION_KEY = 'analytics-session';
const SESSIONS_HISTORY_KEY = 'analytics-sessions-history';

// Session timeout in ms (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Inactivity timeout in ms (5 minutes)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

// Generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Detect device type
function detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Get current session
function getCurrentSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  
  try {
    const session = JSON.parse(stored) as SessionData;
    
    // Check if session is expired
    if (Date.now() - session.lastActivityTime > SESSION_TIMEOUT) {
      endSession(session);
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

// Save session
function saveSession(session: SessionData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// End session and save to history
function endSession(session: SessionData): void {
  if (typeof window === 'undefined') return;
  
  // Duration is calculated from lastActivityTime - startTime
  // Used in session metadata for analytics
  
  // Get history
  const historyStr = localStorage.getItem(SESSIONS_HISTORY_KEY);
  const history: SessionData[] = historyStr ? JSON.parse(historyStr) : [];
  
  // Add to history (keep last 100 sessions)
  history.unshift({
    ...session,
    exitPage: typeof window !== 'undefined' ? window.location.pathname : '',
  });
  
  // Trim history
  if (history.length > 100) {
    history.splice(100);
  }
  
  // Save history
  localStorage.setItem(SESSIONS_HISTORY_KEY, JSON.stringify(history));
  
  // Clear current session
  localStorage.removeItem(SESSION_KEY);
}

// Start new session
function startSession(): SessionData {
  const session: SessionData = {
    sessionId: generateSessionId(),
    startTime: Date.now(),
    lastActivityTime: Date.now(),
    pageViews: 1,
    events: 0,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    entryPage: typeof window !== 'undefined' ? window.location.pathname : '',
    exitPage: '',
    deviceType: detectDeviceType(),
  };
  
  saveSession(session);
  return session;
}

// Update session activity
function updateSessionActivity(): void {
  const session = getCurrentSession();
  if (!session) {
    startSession();
    return;
  }
  
  session.lastActivityTime = Date.now();
  saveSession(session);
}

// Track page view
export function trackPageView(): void {
  let session = getCurrentSession();
  
  if (!session) {
    session = startSession();
    return;
  }
  
  session.pageViews++;
  session.lastActivityTime = Date.now();
  saveSession(session);
}

// Track event
export function trackEvent(): void {
  const session = getCurrentSession();
  if (!session) return;
  
  session.events++;
  session.lastActivityTime = Date.now();
  saveSession(session);
}

// Set user ID
export function setSessionUserId(userId: string): void {
  const session = getCurrentSession();
  if (!session) return;
  
  session.userId = userId;
  saveSession(session);
}

// Get session duration in seconds
export function getSessionDuration(): number {
  const session = getCurrentSession();
  if (!session) return 0;
  
  return Math.round((Date.now() - session.startTime) / 1000);
}

// Get session metrics from history
export function getSessionMetrics(): SessionMetrics {
  if (typeof window === 'undefined') {
    return {
      avgSessionDuration: 0,
      bounceRate: 0,
      pagesPerSession: 0,
      totalSessions: 0,
      activeSessions: 0,
    };
  }
  
  const historyStr = localStorage.getItem(SESSIONS_HISTORY_KEY);
  const history: SessionData[] = historyStr ? JSON.parse(historyStr) : [];
  
  if (history.length === 0) {
    return {
      avgSessionDuration: 0,
      bounceRate: 0,
      pagesPerSession: 0,
      totalSessions: 0,
      activeSessions: getCurrentSession() ? 1 : 0,
    };
  }
  
  // Calculate metrics
  const totalDuration = history.reduce((sum, s) => sum + (s.lastActivityTime - s.startTime), 0);
  const avgDuration = totalDuration / history.length / 1000; // in seconds
  
  const bouncedSessions = history.filter((s) => s.pageViews === 1).length;
  const bounceRate = (bouncedSessions / history.length) * 100;
  
  const totalPageViews = history.reduce((sum, s) => sum + s.pageViews, 0);
  const pagesPerSession = totalPageViews / history.length;
  
  return {
    avgSessionDuration: Math.round(avgDuration),
    bounceRate: Math.round(bounceRate * 10) / 10,
    pagesPerSession: Math.round(pagesPerSession * 10) / 10,
    totalSessions: history.length,
    activeSessions: getCurrentSession() ? 1 : 0,
  };
}

// Initialize session tracking
export function initSessionTracking(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  // Start or resume session
  if (!getCurrentSession()) {
    startSession();
  } else {
    trackPageView();
  }
  
  // Track activity
  let activityTimeout: NodeJS.Timeout;
  
  const handleActivity = () => {
    clearTimeout(activityTimeout);
    updateSessionActivity();
    
    // Set inactivity timeout
    activityTimeout = setTimeout(() => {
      const session = getCurrentSession();
      if (session) {
        endSession(session);
      }
    }, INACTIVITY_TIMEOUT);
  };
  
  // Add event listeners
  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
  events.forEach((event) => {
    window.addEventListener(event, handleActivity, { passive: true });
  });
  
  // Handle page visibility
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      const session = getCurrentSession();
      if (session) {
        session.exitPage = window.location.pathname;
        saveSession(session);
      }
    } else {
      updateSessionActivity();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Handle beforeunload
  const handleBeforeUnload = () => {
    const session = getCurrentSession();
    if (session) {
      session.exitPage = window.location.pathname;
      session.lastActivityTime = Date.now();
      saveSession(session);
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Cleanup function
  return () => {
    clearTimeout(activityTimeout);
    events.forEach((event) => {
      window.removeEventListener(event, handleActivity);
    });
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

// Format duration for display
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} saniye`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes} dk ${remainingSeconds} sn`
      : `${minutes} dakika`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours} saat ${remainingMinutes} dk`
    : `${hours} saat`;
}

export default {
  trackPageView,
  trackEvent,
  setSessionUserId,
  getSessionDuration,
  getSessionMetrics,
  initSessionTracking,
  formatDuration,
};

