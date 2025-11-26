/**
 * Router Types for Phase 8a — Router Brain
 * 
 * Defines the action types and interfaces for the Haiku-powered intent router
 * that powers Cmd+K and global AI behavior.
 */

export type RouterActionType =
  | "navigate"
  | "scroll"
  | "quick_answer"
  | "open_modal"
  | "clarify";

export interface BaseAction {
  id: string;
  type: RouterActionType;
  label: string;
  confidence: number;
}

export interface NavigateAction extends BaseAction {
  type: "navigate";
  href: string;
}

export interface ScrollAction extends BaseAction {
  type: "scroll";
  sectionId: string;
}

export interface QuickAnswerAction extends BaseAction {
  type: "quick_answer";
  answerJSON: unknown;
}

export interface OpenModalAction extends BaseAction {
  type: "open_modal";
  modalQuery: string;
}

export interface ClarifyAction extends BaseAction {
  type: "clarify";
  options: string[];
}

export type RouterAction =
  | NavigateAction
  | ScrollAction
  | QuickAnswerAction
  | OpenModalAction
  | ClarifyAction;

export interface RouterResult {
  actions: RouterAction[];
}

export interface RouterInput {
  query: string;
  pageSlug: string;
  sectionId?: string | null;
  projectSlug?: string | null;
}

