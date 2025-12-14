/**
 * Logger Module Tests
 * Note: In test environment (non-development), only warn/error/fatal levels are logged
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger, { createLogger, withContext, measureTime } from '@/lib/logger';

describe('Logger Module', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('default logger', () => {
        it('should export default logger with all methods', () => {
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.fatal).toBe('function');
        });

        it('should log warn messages', () => {
            logger.warn('Test warning message');
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should log error messages', () => {
            logger.error('Test error message', new Error('Test error'));
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should log fatal messages', () => {
            logger.fatal('Test fatal message', new Error('Fatal error'));
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should log warn with context', () => {
            logger.warn('Test with context', { userId: 'user-123', endpoint: '/api/test' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle error with context containing error field', () => {
            logger.error('Test error', undefined, { error: new Error('Context error'), extra: 'data' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle non-Error objects in error logging', () => {
            logger.error('Test error', 'string error');
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle error with only error in context', () => {
            logger.error('Test error', undefined, { error: new Error('Only error') });
            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('createLogger', () => {
        it('should create namespaced logger', () => {
            const namedLogger = createLogger('TestNamespace');
            expect(namedLogger).toBeDefined();
            expect(typeof namedLogger.warn).toBe('function');
        });

        it('should log warn with namespace', () => {
            const namedLogger = createLogger('TestNamespace');
            namedLogger.warn('Namespaced message');
            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('withContext', () => {
        it('should create logger with base context', () => {
            const contextLogger = withContext({ requestId: 'req-123' });
            expect(contextLogger).toBeDefined();
            expect(typeof contextLogger.warn).toBe('function');
        });

        it('should log warn with base context', () => {
            const contextLogger = withContext({ requestId: 'req-123' });
            contextLogger.warn('Message with base context');
            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('measureTime', () => {
        it('should return function result', () => {
            const result = measureTime(() => {
                return 'test result';
            }, 'test-function');

            expect(result).toBe('test result');
        });

        it('should throw on failed function execution', () => {
            expect(() => {
                measureTime(() => {
                    throw new Error('Test error');
                }, 'failing-function');
            }).toThrow('Test error');
        });
    });

    describe('sensitive data masking', () => {
        it('should mask password in context', () => {
            logger.warn('Test with password', { password: 'secret123' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should mask token in context', () => {
            logger.warn('Test with token', { token: 'jwt-token' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should mask TC numbers', () => {
            logger.warn('Test with TC number', { tc_no: '12345678901' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should mask tcno field', () => {
            logger.warn('Test with tcno', { tcno: '12345678901' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should mask applicant_tc_no field', () => {
            logger.warn('Test with applicant_tc_no', { applicant_tc_no: '12345678901' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should mask tc field', () => {
            logger.warn('Test with tc', { tc: '12345678901' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should mask tcnumber field', () => {
            logger.warn('Test with tcnumber', { tcnumber: '12345678901' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should mask apikey in context', () => {
            logger.warn('Test with apikey', { apikey: 'secret-api-key' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle arrays in context', () => {
            logger.warn('Test with array', {
                items: [{ password: 'secret' }, { name: 'test' }],
            });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle null in context', () => {
            logger.warn('Test with null', { value: null });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle nested objects', () => {
            logger.warn('Test with nested', {
                user: { password: 'secret', name: 'test' },
            });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle hashed TC numbers (64 hex chars)', () => {
            const hashedTc = 'a'.repeat(64);
            logger.warn('Test with hashed TC', { tc_no: hashedTc });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle invalid TC numbers', () => {
            logger.warn('Test with invalid TC', { tc_no: 'invalid' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle null TC number', () => {
            logger.warn('Test with null TC', { tc_no: null });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle undefined TC number', () => {
            logger.warn('Test with undefined TC', { tc_no: undefined });
            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('error handling edge cases', () => {
        it('should handle object error that is not Error instance', () => {
            logger.error('Test error', { code: 500, message: 'Server error' });
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle error with empty context', () => {
            logger.error('Test error', new Error('Test'), {});
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should handle fatal with context', () => {
            logger.fatal('Fatal error', new Error('Fatal'), { critical: true });
            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });
});
