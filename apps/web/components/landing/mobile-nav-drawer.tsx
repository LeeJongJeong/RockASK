"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { appRoutes } from "@/lib/routes";

const navItems = [
  { label: "대시보드", href: appRoutes.home },
  { label: "질문하기", href: appRoutes.newChat },
  { label: "지식 베이스", href: appRoutes.knowledgeSpaces },
  { label: "전문 봇", href: appRoutes.assistants },
  { label: "수집 파이프라인", href: appRoutes.ingestion },
] as const;

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    function getFocusableElements() {
      return Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
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

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.setTimeout(() => {
        const previousActiveElement = previousActiveElementRef.current;
        if (previousActiveElement?.isConnected) {
          previousActiveElement.focus();
        }
      }, 0);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="xl:hidden">
      <button
        type="button"
        className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="모바일 메뉴 닫기"
      />
      <div
        id="mobile-nav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-drawer-title"
        className="fixed inset-y-0 left-0 z-40 flex w-[min(22rem,calc(100vw-1rem))] max-w-full flex-col border-r border-slate-200/70 bg-white/95 px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.24)] backdrop-blur"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Knowledge Hub
            </p>
            <p id="mobile-nav-drawer-title" className="mt-1 text-lg font-semibold text-slate-900">
              RockASK
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500"
            aria-label="메뉴 닫기"
          >
            ✕
          </button>
        </div>

        <nav className="mt-5 grid gap-2" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="rounded-2xl border border-slate-200/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
