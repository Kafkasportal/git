/**
 * Logs and System Events API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the base module
vi.mock('@/lib/appwrite/api/base', () => ({
    listDocuments: vi.fn(),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
}));

import {
    appwriteErrors,
    appwriteSystemAlerts,
    appwriteAuditLogs,
    appwriteCommunicationLogs,
    appwriteSecurityEvents,
} from '@/lib/appwrite/api/logs';
import * as baseModule from '@/lib/appwrite/api/base';

describe('Logs API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('appwriteErrors', () => {
        it('should list errors', async () => {
            const mockDocs = [{ $id: '1', message: 'Error 1' }];
            vi.mocked(baseModule.listDocuments).mockResolvedValue({ documents: mockDocs, total: 1 });

            const result = await appwriteErrors.list();

            expect(baseModule.listDocuments).toHaveBeenCalledWith('errors', undefined);
            expect(result.documents).toEqual(mockDocs);
        });

        it('should get error by id', async () => {
            const mockDoc = { $id: '1', message: 'Error 1' };
            vi.mocked(baseModule.getDocument).mockResolvedValue(mockDoc);

            const result = await appwriteErrors.get('1');

            expect(baseModule.getDocument).toHaveBeenCalledWith('errors', '1');
            expect(result).toEqual(mockDoc);
        });

        it('should create error', async () => {
            const mockDoc = { $id: '1', message: 'New error' };
            vi.mocked(baseModule.createDocument).mockResolvedValue(mockDoc);

            const result = await appwriteErrors.create({ message: 'New error' });

            expect(baseModule.createDocument).toHaveBeenCalledWith('errors', { message: 'New error' });
            expect(result).toEqual(mockDoc);
        });

        it('should update error', async () => {
            const mockDoc = { $id: '1', message: 'Updated' };
            vi.mocked(baseModule.updateDocument).mockResolvedValue(mockDoc);

            const result = await appwriteErrors.update('1', { message: 'Updated' });

            expect(baseModule.updateDocument).toHaveBeenCalledWith('errors', '1', { message: 'Updated' });
            expect(result).toEqual(mockDoc);
        });

        it('should remove error', async () => {
            vi.mocked(baseModule.deleteDocument).mockResolvedValue(undefined);

            await appwriteErrors.remove('1');

            expect(baseModule.deleteDocument).toHaveBeenCalledWith('errors', '1');
        });
    });

    describe('appwriteSystemAlerts', () => {
        it('should list system alerts', async () => {
            vi.mocked(baseModule.listDocuments).mockResolvedValue({ documents: [], total: 0 });

            await appwriteSystemAlerts.list({ limit: 10 });

            expect(baseModule.listDocuments).toHaveBeenCalledWith('systemAlerts', { limit: 10 });
        });

        it('should get system alert by id', async () => {
            vi.mocked(baseModule.getDocument).mockResolvedValue({ $id: '1' });

            await appwriteSystemAlerts.get('1');

            expect(baseModule.getDocument).toHaveBeenCalledWith('systemAlerts', '1');
        });

        it('should create system alert', async () => {
            vi.mocked(baseModule.createDocument).mockResolvedValue({ $id: '1' });

            await appwriteSystemAlerts.create({ type: 'warning' });

            expect(baseModule.createDocument).toHaveBeenCalledWith('systemAlerts', { type: 'warning' });
        });

        it('should update system alert', async () => {
            vi.mocked(baseModule.updateDocument).mockResolvedValue({ $id: '1' });

            await appwriteSystemAlerts.update('1', { resolved: true });

            expect(baseModule.updateDocument).toHaveBeenCalledWith('systemAlerts', '1', { resolved: true });
        });

        it('should remove system alert', async () => {
            vi.mocked(baseModule.deleteDocument).mockResolvedValue(undefined);

            await appwriteSystemAlerts.remove('1');

            expect(baseModule.deleteDocument).toHaveBeenCalledWith('systemAlerts', '1');
        });
    });

    describe('appwriteAuditLogs', () => {
        it('should list audit logs', async () => {
            vi.mocked(baseModule.listDocuments).mockResolvedValue({ documents: [], total: 0 });

            await appwriteAuditLogs.list();

            expect(baseModule.listDocuments).toHaveBeenCalledWith('auditLogs', undefined);
        });

        it('should get audit log by id', async () => {
            vi.mocked(baseModule.getDocument).mockResolvedValue({ $id: '1' });

            await appwriteAuditLogs.get('1');

            expect(baseModule.getDocument).toHaveBeenCalledWith('auditLogs', '1');
        });

        it('should create audit log', async () => {
            vi.mocked(baseModule.createDocument).mockResolvedValue({ $id: '1' });

            await appwriteAuditLogs.create({ action: 'login', userId: 'user-1' });

            expect(baseModule.createDocument).toHaveBeenCalledWith('auditLogs', { action: 'login', userId: 'user-1' });
        });
    });

    describe('appwriteCommunicationLogs', () => {
        it('should list communication logs', async () => {
            vi.mocked(baseModule.listDocuments).mockResolvedValue({ documents: [], total: 0 });

            await appwriteCommunicationLogs.list();

            expect(baseModule.listDocuments).toHaveBeenCalledWith('communicationLogs', undefined);
        });

        it('should get communication log by id', async () => {
            vi.mocked(baseModule.getDocument).mockResolvedValue({ $id: '1' });

            await appwriteCommunicationLogs.get('1');

            expect(baseModule.getDocument).toHaveBeenCalledWith('communicationLogs', '1');
        });

        it('should create communication log', async () => {
            vi.mocked(baseModule.createDocument).mockResolvedValue({ $id: '1' });

            await appwriteCommunicationLogs.create({ type: 'email', recipient: 'test@test.com' });

            expect(baseModule.createDocument).toHaveBeenCalledWith('communicationLogs', { type: 'email', recipient: 'test@test.com' });
        });
    });

    describe('appwriteSecurityEvents', () => {
        it('should list security events', async () => {
            vi.mocked(baseModule.listDocuments).mockResolvedValue({ documents: [], total: 0 });

            await appwriteSecurityEvents.list();

            expect(baseModule.listDocuments).toHaveBeenCalledWith('securityEvents', undefined);
        });

        it('should get security event by id', async () => {
            vi.mocked(baseModule.getDocument).mockResolvedValue({ $id: '1' });

            await appwriteSecurityEvents.get('1');

            expect(baseModule.getDocument).toHaveBeenCalledWith('securityEvents', '1');
        });

        it('should create security event', async () => {
            vi.mocked(baseModule.createDocument).mockResolvedValue({ $id: '1' });

            await appwriteSecurityEvents.create({ event: 'failed_login', ip: '192.168.1.1' });

            expect(baseModule.createDocument).toHaveBeenCalledWith('securityEvents', { event: 'failed_login', ip: '192.168.1.1' });
        });
    });
});
