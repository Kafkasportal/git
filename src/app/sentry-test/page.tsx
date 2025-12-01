"use client";

import { captureError, sentryLogger, startSpan } from "@/lib/sentry";
import * as Sentry from "@sentry/react";

export default function SentryTestPage() {
  // Test 1: Undefined function error
  const triggerUndefinedError = () => {
    startSpan({ op: "ui.click", name: "Trigger Undefined Error" }, () => {
      try {
        // @ts-expect-error - Intentional error for testing
        myUndefinedFunction();
      } catch (error) {
        captureError(error as Error, { test: "undefined-function" });
        throw error; // Re-throw to also trigger unhandled error
      }
    });
  };

  // Test 2: Manual error capture
  const triggerManualError = () => {
    const error = new Error("Bu bir test hatasıdır - Manual Capture");
    captureError(error, { 
      component: "SentryTestPage",
      action: "manual-test" 
    });
    alert("Hata Sentry'e gönderildi!");
  };

  // Test 3: Sentry Logger
  const triggerLogMessages = () => {
    sentryLogger.info("Test info log", { page: "sentry-test" });
    sentryLogger.warn("Test warning log", { severity: "medium" });
    sentryLogger.error("Test error log", { critical: false });
    alert("Log mesajları Sentry'e gönderildi!");
  };

  // Test 4: Native Sentry.logger with fmt
  const triggerFormattedLog = () => {
    const userId = "test-123";
    const action = "button-click";
    if (Sentry.logger) {
      Sentry.logger.info(
        Sentry.logger.fmt`Kullanıcı ${userId} ${action} gerçekleştirdi`
      );
    }
    alert("Formatted log Sentry'e gönderildi!");
  };

  // Test 5: Unhandled Promise Rejection
  const triggerUnhandledRejection = () => {
    Promise.reject(new Error("Unhandled Promise Rejection Test"));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          🔧 Sentry Test Sayfası
        </h1>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Hata Testleri</h2>
            
            <div className="grid gap-4">
              <button
                onClick={triggerManualError}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
              >
                📤 Manual Error Capture
              </button>

              <button
                onClick={triggerUndefinedError}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
              >
                💥 Undefined Function Error
              </button>

              <button
                onClick={triggerUnhandledRejection}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition"
              >
                ⚠️ Unhandled Promise Rejection
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Log Testleri</h2>
            
            <div className="grid gap-4">
              <button
                onClick={triggerLogMessages}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
              >
                📝 Log Messages (info, warn, error)
              </button>

              <button
                onClick={triggerFormattedLog}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
              >
                🏷️ Formatted Log (logger.fmt)
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              <strong>Not:</strong> Hataları görmek için{" "}
              <a 
                href="https://kafkasder-o9.sentry.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                Sentry Dashboard
              </a>
              &apos;a git.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
