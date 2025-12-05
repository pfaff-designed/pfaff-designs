"use client";

import * as React from "react";

// ============================================================
// TYPES
// ============================================================

export type AiModalStatus =
  | "idle"
  | "opening"
  | "thinking"
  | "answer_showing"
  | "waiting_for_input"
  | "error"
  | "closing";
  // TODO (V2 - Streaming): Add "streaming" status for real-time token rendering
  // Flow would be: thinking → streaming (tokens arriving) → answer_showing (complete)

export type AiModalSource = "hover-pill" | "keyboard" | "button";

export interface AiModalState {
  status: AiModalStatus;
  isOpen: boolean;
  source?: AiModalSource;
  headline?: string | null;
  selectedText?: string;
  composerValue: string;
  lastQuestion?: string;
  errorMessage?: string;
  // Context fields for API calls
  topicLabel?: string | null;
  topicId?: string | null;
  // Additional context for openAiModal
  pagePath?: string | null;
  projectSlug?: string | null;
  sectionHeadline?: string | null;
  sectionText?: string | null;
}

// ============================================================
// EVENTS
// ============================================================

export type AiModalEvent =
  | { type: "OPEN_FROM_SELECTION"; payload: { selectedText: string; headline?: string } }
  | { type: "OPEN_GLOBAL"; payload?: { headline?: string; topicLabel?: string; topicId?: string; source?: AiModalSource; selectedText?: string } }
  | { type: "OPEN_AI_MODAL"; payload: { question: string; pagePath?: string; projectSlug?: string; sectionHeadline?: string; sectionText?: string; source?: AiModalSource } }
  | { type: "SET_COMPOSER_VALUE"; payload: { value: string } }
  | { type: "SUBMIT_QUESTION"; payload?: { question?: string } }
  | { type: "SET_THINKING" }
  | { type: "MARK_ANSWER_RECEIVED"; payload?: { headline?: string } }
  | { type: "SET_ERROR"; payload: { message: string } }
  | { type: "CLEAR_ERROR" }
  | { type: "CLOSE" }
  | { type: "FORCE_RESET" };

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: AiModalState = {
  status: "idle",
  isOpen: false,
  source: undefined,
  headline: undefined,
  selectedText: undefined,
  composerValue: "",
  lastQuestion: undefined,
  errorMessage: undefined,
  topicLabel: null,
  topicId: null,
  pagePath: null,
  projectSlug: null,
  sectionHeadline: null,
  sectionText: null,
};

// ============================================================
// REDUCER
// ============================================================

function aiModalReducer(state: AiModalState, event: AiModalEvent): AiModalState {
  switch (event.type) {
    case "OPEN_FROM_SELECTION": {
      const { selectedText, headline } = event.payload;
      
      if (!state.isOpen) {
        // Modal closed → open it
        return {
          ...state,
          isOpen: true,
          status: "opening",
          source: "hover-pill",
          selectedText,
          headline,
          topicLabel: headline ?? null,
          topicId: null,
          errorMessage: undefined,
          composerValue: "",
          lastQuestion: undefined,
        };
      } else {
        // Modal already open → replace content while open
        return {
          ...state,
          status: "opening",
          source: "hover-pill",
          selectedText,
          headline,
          topicLabel: headline ?? null,
          topicId: null,
          errorMessage: undefined,
          composerValue: "",
          lastQuestion: undefined,
          // isOpen stays true
        };
      }
    }

    case "OPEN_GLOBAL": {
      const { headline, topicLabel, topicId, source, selectedText } = event.payload || {};
      
      if (!state.isOpen) {
        // Modal closed → open it
        return {
          ...state,
          isOpen: true,
          status: "opening",
          source: source ?? "keyboard",
          selectedText: selectedText ?? undefined,
          headline: headline ?? state.headline ?? null,
          topicLabel: topicLabel ?? state.topicLabel ?? null,
          topicId: topicId ?? state.topicId ?? null,
          errorMessage: undefined,
          composerValue: "",
          lastQuestion: undefined,
        };
      } else {
        // Modal already open → replace content while open
        return {
          ...state,
          status: "opening",
          source: source ?? "keyboard",
          selectedText: selectedText ?? undefined,
          headline: headline ?? state.headline ?? null,
          topicLabel: topicLabel ?? state.topicLabel ?? null,
          topicId: topicId ?? state.topicId ?? null,
          errorMessage: undefined,
          composerValue: "",
          lastQuestion: undefined,
          // isOpen stays true
        };
      }
    }

    case "OPEN_AI_MODAL": {
      const { question, pagePath, projectSlug, sectionHeadline, sectionText, source } = event.payload;
      
      // Open modal if closed, set context, and immediately submit question
      const baseState = !state.isOpen
        ? {
            ...state,
            isOpen: true,
            status: "thinking" as AiModalStatus, // Go directly to thinking since we're submitting
            source: (source ?? "keyboard") as AiModalSource,
            errorMessage: undefined,
            composerValue: "",
            lastQuestion: question,
          }
        : {
            ...state,
            status: "thinking" as AiModalStatus, // Go directly to thinking since we're submitting
            source: (source ?? state.source ?? "keyboard") as AiModalSource,
            errorMessage: undefined,
            composerValue: "",
            lastQuestion: question,
          };

      return {
        ...baseState,
        pagePath: pagePath ?? null,
        projectSlug: projectSlug ?? null,
        sectionHeadline: sectionHeadline ?? null,
        sectionText: sectionText ?? null,
        topicLabel: sectionHeadline ?? null,
      };
    }

    case "SET_COMPOSER_VALUE": {
      return {
        ...state,
        composerValue: event.payload.value,
      };
    }

    case "SUBMIT_QUESTION": {
      // Resolve question: prefer payload, fallback to composerValue
      const question = (event.payload?.question ?? state.composerValue).trim();
      
      if (!question) {
        // Empty question → ignore
        return state;
      }
      
      // TODO (V2 streaming): Transition to "streaming" status instead of "thinking"
      // when streaming is enabled. Keep "thinking" for non-streaming fallback.
      return {
        ...state,
        status: "thinking",
        lastQuestion: question,
        composerValue: "",
      };
    }

    case "SET_THINKING": {
      return {
        ...state,
        status: "thinking",
      };
    }

    case "MARK_ANSWER_RECEIVED": {
      const { headline } = event.payload || {};
      
      // TODO (V2 streaming): When streaming is complete, this event will mark
      // the transition from "streaming" → "answer_showing". For now, it handles
      // "thinking" → "answer_showing".
      return {
        ...state,
        status: "answer_showing",
        headline: headline ?? state.headline,
        errorMessage: undefined,
      };
    }

    case "SET_ERROR": {
      return {
        ...state,
        status: "error",
        errorMessage: event.payload.message,
        isOpen: true, // Keep modal open to show error
      };
    }

    case "CLEAR_ERROR": {
      // If we have a lastQuestion, assume we're in conversation → waiting_for_input
      // Otherwise → opening
      const newStatus: AiModalStatus = state.lastQuestion
        ? "waiting_for_input"
        : "opening";
      
      return {
        ...state,
        status: newStatus,
        errorMessage: undefined,
      };
    }

    case "CLOSE": {
      return {
        ...state,
        isOpen: false,
        status: "idle",
        source: undefined,
        headline: undefined,
        selectedText: undefined,
        composerValue: "",
        lastQuestion: undefined,
        errorMessage: undefined,
        topicLabel: null,
        topicId: null,
        pagePath: null,
        projectSlug: null,
        sectionHeadline: null,
        sectionText: null,
      };
    }

    case "FORCE_RESET": {
      return initialState;
    }

    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

export interface OpenGlobalOptions {
  headline?: string;
  topicLabel?: string;
  topicId?: string;
  source?: AiModalSource;
  selectedText?: string;
}

export interface OpenAiModalOptions {
  question: string;
  pagePath?: string;
  projectSlug?: string;
  sectionHeadline?: string;
  sectionText?: string;
  source?: AiModalSource;
}

export interface AiModalContextValue {
  state: AiModalState;
  // Derived flags
  isOpen: boolean;
  isThinking: boolean;
  hasError: boolean;
  // Actions
  openFromSelection: (payload: { selectedText: string; headline?: string }) => void;
  openGlobal: (payload?: OpenGlobalOptions) => void;
  openAiModal: (options: OpenAiModalOptions) => void;
  setComposerValue: (value: string) => void;
  submitQuestion: (options?: { question?: string }) => void;
  markAnswerReceived: (options?: { headline?: string }) => void;
  setError: (message: string) => void;
  clearError: () => void;
  close: () => void;
  reset: () => void;
}

const AiModalContext = React.createContext<AiModalContextValue | null>(null);

// ============================================================
// PROVIDER
// ============================================================

export function AiModalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(aiModalReducer, initialState);

  const value: AiModalContextValue = React.useMemo(
    () => ({
      state,
      isOpen: state.isOpen,
      isThinking: state.status === "thinking",
      hasError: state.status === "error",
      openFromSelection: (payload) =>
        dispatch({ type: "OPEN_FROM_SELECTION", payload }),
      openGlobal: (payload) => dispatch({ type: "OPEN_GLOBAL", payload }),
      openAiModal: (options) => {
        dispatch({ type: "OPEN_AI_MODAL", payload: options });
      },
      setComposerValue: (value) =>
        dispatch({ type: "SET_COMPOSER_VALUE", payload: { value } }),
      submitQuestion: (options) =>
        dispatch({
          type: "SUBMIT_QUESTION",
          payload: { question: options?.question },
        }),
      markAnswerReceived: (options) =>
        dispatch({
          type: "MARK_ANSWER_RECEIVED",
          payload: { headline: options?.headline },
        }),
      setError: (message) => dispatch({ type: "SET_ERROR", payload: { message } }),
      clearError: () => dispatch({ type: "CLEAR_ERROR" }),
      close: () => dispatch({ type: "CLOSE" }),
      reset: () => dispatch({ type: "FORCE_RESET" }),
    }),
    [state]
  );

  return <AiModalContext.Provider value={value}>{children}</AiModalContext.Provider>;
}

// ============================================================
// HOOK
// ============================================================

export function useAiModal(): AiModalContextValue {
  const ctx = React.useContext(AiModalContext);
  if (!ctx) {
    throw new Error("useAiModal must be used within an AiModalProvider");
  }
  return ctx;
}

