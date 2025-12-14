import { describe, it, expect } from 'vitest';
import {
  QUERY_STALE_TIMES,
  QUERY_GC_TIMES,
  queryKeys,
  getQueryOptions,
  defaultQueryOptions,
  getInvalidationKeys,
} from '@/lib/api/query-config';

describe('Query Configuration', () => {
  describe('QUERY_STALE_TIMES', () => {
    it('should define stale times for all entities', () => {
      expect(QUERY_STALE_TIMES.realtime).toBe(0);
      expect(QUERY_STALE_TIMES.messages).toBe(30 * 1000);
      expect(QUERY_STALE_TIMES.notifications).toBe(30 * 1000);
      expect(QUERY_STALE_TIMES.todos).toBe(1 * 60 * 1000);
      expect(QUERY_STALE_TIMES.tasks).toBe(2 * 60 * 1000);
    });

    it('should define correct stale times for analytics entities', () => {
      expect(QUERY_STALE_TIMES.dashboard).toBe(2 * 60 * 1000);
      expect(QUERY_STALE_TIMES.analytics).toBe(5 * 60 * 1000);
      expect(QUERY_STALE_TIMES.meetings).toBe(5 * 60 * 1000);
      expect(QUERY_STALE_TIMES.donations).toBe(5 * 60 * 1000);
      expect(QUERY_STALE_TIMES.aidApplications).toBe(5 * 60 * 1000);
    });

    it('should define correct stale times for slow-changing entities', () => {
      expect(QUERY_STALE_TIMES.beneficiaries).toBe(10 * 60 * 1000);
      expect(QUERY_STALE_TIMES.partners).toBe(10 * 60 * 1000);
      expect(QUERY_STALE_TIMES.scholarships).toBe(10 * 60 * 1000);
      expect(QUERY_STALE_TIMES.users).toBe(15 * 60 * 1000);
      expect(QUERY_STALE_TIMES.settings).toBe(30 * 60 * 1000);
    });

    it('should define correct stale times for static entities', () => {
      expect(QUERY_STALE_TIMES.constants).toBe(60 * 60 * 1000);
      expect(QUERY_STALE_TIMES.config).toBe(60 * 60 * 1000);
    });
  });

  describe('QUERY_GC_TIMES', () => {
    it('should define garbage collection times', () => {
      expect(QUERY_GC_TIMES.short).toBe(5 * 60 * 1000);
      expect(QUERY_GC_TIMES.medium).toBe(15 * 60 * 1000);
      expect(QUERY_GC_TIMES.long).toBe(30 * 60 * 1000);
      expect(QUERY_GC_TIMES.extended).toBe(60 * 60 * 1000);
    });

    it('should have gc times in increasing order', () => {
      expect(QUERY_GC_TIMES.short).toBeLessThan(QUERY_GC_TIMES.medium);
      expect(QUERY_GC_TIMES.medium).toBeLessThan(QUERY_GC_TIMES.long);
      expect(QUERY_GC_TIMES.long).toBeLessThan(QUERY_GC_TIMES.extended);
    });
  });

  describe('queryKeys', () => {
    it('should create beneficiary query keys', () => {
      expect(queryKeys.beneficiaries.all).toEqual(['beneficiaries']);
      expect(queryKeys.beneficiaries.lists()).toEqual(['beneficiaries', 'list']);
      expect(queryKeys.beneficiaries.list()).toEqual(['beneficiaries', 'list', undefined]);
      expect(queryKeys.beneficiaries.list({ page: 1 })).toEqual(['beneficiaries', 'list', { page: 1 }]);
      expect(queryKeys.beneficiaries.details()).toEqual(['beneficiaries', 'detail']);
      expect(queryKeys.beneficiaries.detail('id-123')).toEqual(['beneficiaries', 'detail', 'id-123']);
      expect(queryKeys.beneficiaries.analytics()).toEqual(['beneficiaries', 'analytics']);
    });

    it('should create donation query keys', () => {
      expect(queryKeys.donations.all).toEqual(['donations']);
      expect(queryKeys.donations.lists()).toEqual(['donations', 'list']);
      expect(queryKeys.donations.details()).toEqual(['donations', 'detail']);
      expect(queryKeys.donations.detail('id-456')).toEqual(['donations', 'detail', 'id-456']);
      expect(queryKeys.donations.stats()).toEqual(['donations', 'stats']);
    });

    it('should create user query keys', () => {
      expect(queryKeys.users.all).toEqual(['users']);
      expect(queryKeys.users.lists()).toEqual(['users', 'list']);
      expect(queryKeys.users.details()).toEqual(['users', 'detail']);
      expect(queryKeys.users.detail('user-1')).toEqual(['users', 'detail', 'user-1']);
      expect(queryKeys.users.current()).toEqual(['users', 'current']);
    });

    it('should support all entity types', () => {
      expect(queryKeys.meetings).toBeDefined();
      expect(queryKeys.messages).toBeDefined();
      expect(queryKeys.notifications).toBeDefined();
      expect(queryKeys.tasks).toBeDefined();
      expect(queryKeys.todos).toBeDefined();
      expect(queryKeys.scholarships).toBeDefined();
      expect(queryKeys.partners).toBeDefined();
      expect(queryKeys.aidApplications).toBeDefined();
      expect(queryKeys.settings).toBeDefined();
      expect(queryKeys.analytics).toBeDefined();
      expect(queryKeys.dashboard).toBeDefined();
    });

    it('should create proper keys for meetings', () => {
      expect(queryKeys.meetings.all).toEqual(['meetings']);
      expect(queryKeys.meetings.detail('meeting-1')).toEqual(['meetings', 'detail', 'meeting-1']);
      expect(queryKeys.meetings.lists()).toEqual(['meetings', 'list']);
      expect(queryKeys.meetings.decisions('meeting-1')).toContain('decisions');
      expect(queryKeys.meetings.actionItems('meeting-1')).toContain('actionItems');
    });

    it('should create proper keys for messages', () => {
      expect(queryKeys.messages.all).toEqual(['messages']);
      expect(queryKeys.messages.detail('msg-1')).toEqual(['messages', 'detail', 'msg-1']);
      expect(queryKeys.messages.unread()).toEqual(['messages', 'unread']);
    });

    it('should create proper keys for notifications', () => {
      expect(queryKeys.notifications.all).toEqual(['notifications']);
      expect(queryKeys.notifications.lists()).toEqual(['notifications', 'list']);
      expect(queryKeys.notifications.unread()).toEqual(['notifications', 'unread']);
      expect(queryKeys.notifications.count()).toEqual(['notifications', 'count']);
    });

    it('should create proper keys for tasks', () => {
      expect(queryKeys.tasks.all).toEqual(['tasks']);
      expect(queryKeys.tasks.detail('task-1')).toEqual(['tasks', 'detail', 'task-1']);
      expect(queryKeys.tasks.byUser('user-1')).toEqual(['tasks', 'user', 'user-1']);
    });

    it('should create proper keys for todos', () => {
      expect(queryKeys.todos.all).toEqual(['todos']);
      expect(queryKeys.todos.detail('todo-1')).toEqual(['todos', 'detail', 'todo-1']);
    });

    it('should create proper keys for scholarships', () => {
      expect(queryKeys.scholarships.all).toEqual(['scholarships']);
      expect(queryKeys.scholarships.detail('scholarship-1')).toEqual(['scholarships', 'detail', 'scholarship-1']);
    });

    it('should create proper keys for partners', () => {
      expect(queryKeys.partners.all).toEqual(['partners']);
      expect(queryKeys.partners.detail('partner-1')).toEqual(['partners', 'detail', 'partner-1']);
    });

    it('should create proper keys for aid applications', () => {
      expect(queryKeys.aidApplications.all).toEqual(['aidApplications']);
      expect(queryKeys.aidApplications.detail('aid-1')).toEqual(['aidApplications', 'detail', 'aid-1']);
    });

    it('should create proper keys for settings', () => {
      expect(queryKeys.settings.all).toEqual(['settings']);
      expect(queryKeys.settings.general()).toEqual(['settings', 'general']);
      expect(queryKeys.settings.branding()).toEqual(['settings', 'branding']);
      expect(queryKeys.settings.notifications()).toEqual(['settings', 'notifications']);
    });

    it('should create proper keys for dashboard', () => {
      expect(queryKeys.dashboard.all).toEqual(['dashboard']);
      expect(queryKeys.dashboard.stats()).toEqual(['dashboard', 'stats']);
      expect(queryKeys.dashboard.charts()).toEqual(['dashboard', 'charts']);
      expect(queryKeys.dashboard.recent()).toEqual(['dashboard', 'recent']);
    });

    it('should create proper keys for analytics', () => {
      expect(queryKeys.analytics.all).toEqual(['analytics']);
      expect(queryKeys.analytics.overview()).toEqual(['analytics', 'overview']);
      expect(queryKeys.analytics.financial()).toEqual(['analytics', 'financial']);
      expect(queryKeys.analytics.beneficiary()).toEqual(['analytics', 'beneficiary']);
    });

    it('should create proper keys with filters', () => {
      const filters = { search: 'test', limit: 10 };
      expect(queryKeys.beneficiaries.list(filters)).toContain(filters);
      expect(queryKeys.donations.list(filters)).toContain(filters);
      expect(queryKeys.users.list(filters)).toContain(filters);
    });
  });

  describe('getQueryOptions', () => {
    it('should return correct options for beneficiaries', () => {
      const options = getQueryOptions('beneficiaries');
      expect(options.staleTime).toBe(10 * 60 * 1000);
      expect(options.gcTime).toBeGreaterThan(0);
    });

    it('should return correct options for realtime data', () => {
      const options = getQueryOptions('realtime');
      expect(options.staleTime).toBe(0);
    });

    it('should return correct options for messages', () => {
      const options = getQueryOptions('messages');
      expect(options.staleTime).toBe(30 * 1000);
    });

    it('should return correct options for settings', () => {
      const options = getQueryOptions('settings');
      expect(options.staleTime).toBe(30 * 60 * 1000);
    });

    it('should calculate gcTime based on staleTime', () => {
      const shortOptions = getQueryOptions('messages');
      const longOptions = getQueryOptions('settings');
      expect(shortOptions.gcTime).toBeLessThanOrEqual(longOptions.gcTime);
    });
  });

  describe('defaultQueryOptions', () => {
    it('should define default query options', () => {
      expect(defaultQueryOptions.queries).toBeDefined();
      expect(defaultQueryOptions.queries.staleTime).toBeGreaterThan(0);
      expect(defaultQueryOptions.queries.gcTime).toBeGreaterThan(0);
      expect(defaultQueryOptions.queries.retry).toBe(2);
      expect(defaultQueryOptions.queries.refetchOnWindowFocus).toBe(false);
      expect(defaultQueryOptions.queries.refetchOnReconnect).toBe(true);
    });

    it('should have correct retry delay strategy', () => {
      const { retryDelay } = defaultQueryOptions.queries;
      if (typeof retryDelay === 'function') {
        expect(retryDelay(0)).toBeLessThan(retryDelay(1));
        expect(retryDelay(2)).toBeLessThanOrEqual(30000);
      }
    });
  });

  describe('getInvalidationKeys', () => {
    it('should return invalidation keys for beneficiaries', () => {
      const keys = getInvalidationKeys('beneficiaries', 'create');
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContainEqual(['beneficiaries']);
    });

    it('should return invalidation keys for donations', () => {
      const keys = getInvalidationKeys('donations', 'update');
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should return default key for unknown entity', () => {
      const keys = getInvalidationKeys('users', 'delete');
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should return related keys for meetings', () => {
      const keys = getInvalidationKeys('meetings', 'create');
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should return related keys for scholarships', () => {
      const keys = getInvalidationKeys('scholarships', 'update');
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should return related keys for messages', () => {
      const keys = getInvalidationKeys('messages', 'create');
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContainEqual(['messages']);
    });

    it('should return related keys for tasks', () => {
      const keys = getInvalidationKeys('tasks', 'update');
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should return related keys for todos', () => {
      const keys = getInvalidationKeys('todos', 'delete');
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should return related keys for partners', () => {
      const keys = getInvalidationKeys('partners', 'create');
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should return related keys for aidApplications', () => {
      const keys = getInvalidationKeys('aidApplications', 'update');
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should return related keys for notifications', () => {
      const keys = getInvalidationKeys('notifications', 'delete');
      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('getQueryOptions - gcTime calculation', () => {
    it('should return short gcTime for realtime data', () => {
      const options = getQueryOptions('realtime');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.short);
    });

    it('should return short gcTime for messages (staleTime <= 60s)', () => {
      const options = getQueryOptions('messages');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.short);
    });

    it('should return medium gcTime for dashboard (staleTime <= 5min)', () => {
      const options = getQueryOptions('dashboard');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.medium);
    });

    it('should return medium gcTime for donations (staleTime = 5min)', () => {
      const options = getQueryOptions('donations');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.medium);
    });

    it('should return long gcTime for beneficiaries (staleTime = 10min)', () => {
      const options = getQueryOptions('beneficiaries');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.long);
    });

    it('should return long gcTime for users (staleTime = 15min)', () => {
      const options = getQueryOptions('users');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.long);
    });

    it('should return extended gcTime for settings (staleTime = 30min)', () => {
      const options = getQueryOptions('settings');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.extended);
    });

    it('should return extended gcTime for constants (staleTime = 1hr)', () => {
      const options = getQueryOptions('constants');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.extended);
    });

    it('should return extended gcTime for config (staleTime = 1hr)', () => {
      const options = getQueryOptions('config');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.extended);
    });

    it('should return short gcTime for todos (staleTime = 1min)', () => {
      const options = getQueryOptions('todos');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.short);
    });

    it('should return medium gcTime for tasks (staleTime = 2min)', () => {
      const options = getQueryOptions('tasks');
      expect(options.gcTime).toBe(QUERY_GC_TIMES.medium);
    });
  });
});
