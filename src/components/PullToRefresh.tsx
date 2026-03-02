"use client";

import React, { useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 80;

export function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (startYRef.current === null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0 && window.scrollY === 0) {
        e.preventDefault();
        const clamped = Math.min(dy, PULL_THRESHOLD * 1.5);
        pullDistanceRef.current = clamped;
        setPullDistance(clamped);
      }
    }

    function handleTouchEnd() {
      if (pullDistanceRef.current >= PULL_THRESHOLD) {
        setRefreshing(true);
        setTimeout(() => window.location.reload(), 300);
      }
      startYRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  if (pullDistance === 0 && !refreshing) return null;

  const readyToRelease = pullDistance >= PULL_THRESHOLD;
  const label = refreshing
    ? "Refreshing"
    : readyToRelease
      ? "Release to refresh"
      : "Pull to refresh";

  return (
    <div
      className="pull-to-refresh-indicator"
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <span className="pull-to-refresh-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
