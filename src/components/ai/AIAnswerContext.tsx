"use client";

import * as React from "react";
import type { PageJSON } from "@/components/utility/Renderer";

export interface SectionAnswer {
  answerLayout: PageJSON | null;
  status: "idle" | "loading" | "success" | "error";
  prompt: string;
  updatedAt: string;
  error: string | null;
  answerId: string;
}

export interface AIAnswerState {
  // Global answer (for full-page answers)
  answerLayout: PageJSON | null;
  status: "idle" | "loading" | "success" | "error";
  lastPrompt: string | null;
  lastUpdatedAt: string | null;
  error: string | null;
  // Section-specific answers (for inline answers)
  sectionAnswers: Map<string, SectionAnswer>;
}

export interface AIAnswerContextValue {
  state: AIAnswerState;
  // Global answer methods
  setAnswerLayout: (layout: PageJSON | null) => void;
  setStatus: (status: AIAnswerState["status"]) => void;
  setLastPrompt: (prompt: string | null) => void;
  setError: (error: string | null) => void;
  clearAnswer: () => void;
  // Section-specific answer methods
  setSectionAnswer: (sectionId: string, answer: Partial<SectionAnswer>) => void;
  getSectionAnswer: (sectionId: string) => SectionAnswer | undefined;
  clearSectionAnswer: (sectionId: string) => void;
  clearAllSectionAnswers: () => void;
}

const AIAnswerContext = React.createContext<AIAnswerContextValue | undefined>(
  undefined
);

export function AIAnswerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AIAnswerState>({
    answerLayout: null,
    status: "idle",
    lastPrompt: null,
    lastUpdatedAt: null,
    error: null,
    sectionAnswers: new Map(),
  });

  const setAnswerLayout = React.useCallback((layout: PageJSON | null) => {
    setState((prev) => ({
      ...prev,
      answerLayout: layout,
      status: layout ? "success" : "idle",
      lastUpdatedAt: layout ? new Date().toISOString() : prev.lastUpdatedAt,
      error: null,
    }));
  }, []);

  const setStatus = React.useCallback((status: AIAnswerState["status"]) => {
    setState((prev) => ({
      ...prev,
      status,
      error: status === "error" ? prev.error : null,
    }));
  }, []);

  const setLastPrompt = React.useCallback((prompt: string | null) => {
    setState((prev) => ({
      ...prev,
      lastPrompt: prompt,
    }));
  }, []);

  const setError = React.useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
      status: error ? "error" : prev.status,
    }));
  }, []);

  const clearAnswer = React.useCallback(() => {
    setState((prev) => ({
      answerLayout: null,
      status: "idle",
      lastPrompt: null,
      lastUpdatedAt: null,
      error: null,
      sectionAnswers: prev.sectionAnswers, // Keep section answers
    }));
  }, []);

  // Section-specific answer methods
  const setSectionAnswer = React.useCallback(
    (sectionId: string, answer: Partial<SectionAnswer>) => {
      setState((prev) => {
        const next = new Map(prev.sectionAnswers);
        const existing = next.get(sectionId) || {
          answerLayout: null,
          status: "idle" as const,
          prompt: "",
          updatedAt: new Date().toISOString(),
          error: null,
          answerId: sectionId,
        };
        
        next.set(sectionId, {
          ...existing,
          ...answer,
          answerId: answer.answerId || existing.answerId || sectionId,
          updatedAt: answer.updatedAt || existing.updatedAt || new Date().toISOString(),
        });
        
        return {
          ...prev,
          sectionAnswers: next,
        };
      });
    },
    []
  );

  const getSectionAnswer = React.useCallback(
    (sectionId: string): SectionAnswer | undefined => {
      const answer = state.sectionAnswers.get(sectionId);
      return answer;
    },
    [state.sectionAnswers]
  );

  const clearSectionAnswer = React.useCallback((sectionId: string) => {
    setState((prev) => {
      const next = new Map(prev.sectionAnswers);
      next.delete(sectionId);
      return {
        ...prev,
        sectionAnswers: next,
      };
    });
  }, []);

  const clearAllSectionAnswers = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      sectionAnswers: new Map(),
    }));
  }, []);

  const value = React.useMemo<AIAnswerContextValue>(
    () => ({
      state,
      setAnswerLayout,
      setStatus,
      setLastPrompt,
      setError,
      clearAnswer,
      setSectionAnswer,
      getSectionAnswer,
      clearSectionAnswer,
      clearAllSectionAnswers,
    }),
    [
      state,
      setAnswerLayout,
      setStatus,
      setLastPrompt,
      setError,
      clearAnswer,
      setSectionAnswer,
      getSectionAnswer,
      clearSectionAnswer,
      clearAllSectionAnswers,
    ]
  );

  return (
    <AIAnswerContext.Provider value={value}>{children}</AIAnswerContext.Provider>
  );
}

export function useAIAnswer() {
  const context = React.useContext(AIAnswerContext);
  if (context === undefined) {
    throw new Error("useAIAnswer must be used within an AIAnswerProvider");
  }
  return context;
}

