"use client";

type PlausibleFn = (eventName: string, options?: { props?: Record<string, any> }) => void;

const getPlausible = (): PlausibleFn | null => {
  if (typeof window === "undefined") return null;
  const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible;
  return typeof plausible === "function" ? plausible : null;
};

let startTime: number | null = null;

export const trackAIModalOpen = () => {
  const plausible = getPlausible();
  if (!plausible) return;
  plausible("ai_modal_open");
};

export const trackAIModalClose = () => {
  const plausible = getPlausible();
  if (!plausible) return;
  plausible("ai_modal_close");
};

export const startAIModalTimer = () => {
  startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
};

export const stopAIModalTimer = () => {
  const plausible = getPlausible();
  if (!plausible) return;
  if (startTime == null) return;

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const durationSeconds = Math.round((now - startTime) / 1000);

  plausible("ai_modal_duration", {
    props: { duration_seconds: durationSeconds },
  });

  startTime = null;
};


