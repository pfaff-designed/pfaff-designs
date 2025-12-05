

# Phase 14.2 — Track AI Modal Open, Close, and Duration

## Goal
Implement analytics tracking for:
- When the AI modal opens
- When the AI modal closes
- How long a user keeps the AI modal open

This should use the existing Plausible Analytics integration via `window.plausible`.

---

## Requirements

### 1. Emit These Events
Implement these Plausible events:

#### **A. ai_modal_open**
Triggered immediately when the modal becomes visible.

#### **B. ai_modal_close**
Triggered when the modal closes.

#### **C. ai_modal_duration**
Triggered when:
- The modal closes OR
- The user navigates away  
Whichever happens first.

The duration should be measured in **seconds**, rounded.

Event properties:
```ts
{
  duration_seconds: number;
}
```

---

## 2. Where to Implement
Modify the `AIExperienceModal` (or whichever component controls visibility) to add:

- A timestamp when opened
- A call to Plausible on open
- A call to Plausible on close with duration logic

If the modal logic is split (e.g., open in cmdk, render in a provider), trace the visibility state to the component that reliably triggers on mount/unmount.

---

## 3. Safety Requirements
- No analytics should run during SSR → check `typeof window !== "undefined"`.
- If `window.plausible` does not exist, fail silently.
- Keep all analytics code inside a small helper (recommended: `lib/analytics/aiModal.ts`) to avoid clutter.

---

## 4. Implementation Sketch

### In `lib/analytics/aiModal.ts`:
```ts
export function trackAIModalOpen() {
  if (typeof window === "undefined" || !window.plausible) return;
  window.plausible("ai_modal_open");
}

let startTime: number | null = null;

export function startAIModalTimer() {
  startTime = performance.now();
}

export function stopAIModalTimer() {
  if (typeof window === "undefined" || !window.plausible) return;
  if (startTime == null) return;

  const durationMs = performance.now() - startTime;
  const durationSeconds = Math.round(durationMs / 1000);

  window.plausible("ai_modal_duration", {
    props: { duration_seconds: durationSeconds }
  });

  startTime = null;
}
```

### In the modal component:
```ts
useEffect(() => {
  if (isOpen) {
    trackAIModalOpen();
    startAIModalTimer();
  }

  return () => {
    if (isOpen) stopAIModalTimer();
  };
}, [isOpen]);
```

---

## 5. Definition of Done

- Opening the modal triggers `ai_modal_open` in Plausible.
- Closing the modal logs `ai_modal_close`.
- `ai_modal_duration` logs with correct seconds.
- Events appear in Plausible under "Custom Events."
- No runtime errors, including headless SSR environments.
- No existing functionality of the AI modal is disturbed.

---

Proceed with implementing Phase 14.2.