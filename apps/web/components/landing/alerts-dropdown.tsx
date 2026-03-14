"use client";

import type { SystemAlert } from "@rockask/types";
import { useEffect, useRef } from "react";

import { SectionEmptyState } from "@/components/landing/section-empty-state";
import { formatAlertSeverityLabel } from "@/lib/dashboard-formatters";

interface AlertsDropdownProps {
  alerts: SystemAlert[];
  isOpen: boolean;
  unreadCount: number;
  onToggle: () => void;
  onClose: () => void;
}

export function AlertsDropdown({
  alerts,
  isOpen,
  unreadCount,
  onToggle,
  onClose,
}: AlertsDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    function getFocusableElements() {
      return Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.setTimeout(() => {
        const previousActiveElement = previousActiveElementRef.current;
        if (previousActiveElement?.isConnected) {
          previousActiveElement.focus();
          return;
        }

        triggerRef.current?.focus();
      }, 0);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-label="알림"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="alerts-dropdown"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500"
      >
        알
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          id="alerts-dropdown"
          role="dialog"
          aria-modal="false"
          aria-labelledby="alerts-dropdown-title"
          tabIndex={-1}
          className="absolute right-0 top-14 z-30 w-[min(28rem,calc(100vw-2rem))] rounded-[28px] border border-slate-200/70 bg-white/95 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-2 pb-3">
            <div>
              <p id="alerts-dropdown-title" className="text-sm font-semibold text-slate-900">
                시스템 알림
              </p>
              <p className="mt-1 text-xs text-slate-500">
                동기화 오류, 수집 실패, 주의 상태를 확인합니다.
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500"
              aria-label="알림 닫기"
            >
              닫기
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {alerts.length === 0 ? (
              <SectionEmptyState
                title="표시할 알림이 없습니다."
                description="오류나 주의 상태가 생기면 가장 최신 순서로 이 영역에 표시됩니다."
              />
            ) : (
              alerts.map((alert) => (
                <article
                  key={alert.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {formatAlertSeverityLabel(alert.severity)}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                      {formatAlertSeverityLabel(alert.severity)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{alert.body}</p>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
