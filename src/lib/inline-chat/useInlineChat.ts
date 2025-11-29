"use client";

import * as React from "react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type InlineChatState = {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  anchorPosition: { x: number; y: number } | null;
  initialContext?: {
    selectionText?: string;
    sectionText?: string;
    pagePath?: string;
    projectSlug?: string | null;
  };
};

export type OpenInlineChatArgs = {
  question: string;
  selectionText?: string;
  sectionText?: string;
  pagePath?: string;
  projectSlug?: string | null;
  position?: { x: number; y: number };
};

export interface UseInlineChatReturn {
  state: InlineChatState;
  openInlineChat: (args: OpenInlineChatArgs) => Promise<void>;
  closeInlineChat: () => void;
  setAnchorPosition: (position: { x: number; y: number } | null) => void;
  sendFollowUp: (question: string) => Promise<void>;
}

/**
 * Hook to manage inline chat state and API calls
 */
export function useInlineChat(): UseInlineChatReturn {
  const [state, setState] = React.useState<InlineChatState>({
    isOpen: false,
    messages: [],
    isLoading: false,
    anchorPosition: null,
    initialContext: undefined,
  });

  const sendMessage = React.useCallback(
    async (
      question: string,
      messages: ChatMessage[],
      context?: {
        selectionText?: string;
        sectionText?: string;
        pagePath?: string;
        projectSlug?: string | null;
      }
    ) => {
      // Add user message to conversation
      const updatedMessages: ChatMessage[] = [
        ...messages,
        { role: "user", content: question },
      ];

      setState((prev) => ({
        ...prev,
        messages: updatedMessages,
        isLoading: true,
      }));

      try {
        // Call quick answer API with conversation history
        const response = await fetch("/api/ai/quick", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
            messages: updatedMessages.slice(0, -1), // Send previous messages (excluding the one we just added)
            pagePath: context?.pagePath,
            projectSlug: context?.projectSlug,
            sectionText: context?.sectionText,
            selectionText: context?.selectionText,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Add assistant response to conversation
        setState((prev) => ({
          ...prev,
          messages: [...updatedMessages, { role: "assistant", content: data.answer }],
          isLoading: false,
        }));
      } catch (error) {
        console.error("[useInlineChat] Error fetching quick answer:", error);

        setState((prev) => ({
          ...prev,
          messages: [
            ...updatedMessages,
            {
              role: "assistant",
              content: "Something went wrong fetching a quick answer. Try again in a moment.",
            },
          ],
          isLoading: false,
        }));
      }
    },
    []
  );

  const openInlineChat = React.useCallback(
    async (args: OpenInlineChatArgs) => {
      console.log("[useInlineChat] openInlineChat called with:", args);
      // Set initial state
      const anchorPosition = args.position ?? {
        x: window.innerWidth / 2,
        y: window.innerHeight / 3,
      };

      const initialContext = {
        selectionText: args.selectionText,
        sectionText: args.sectionText,
        pagePath: args.pagePath,
        projectSlug: args.projectSlug,
      };

      console.log("[useInlineChat] Setting state to open with position:", anchorPosition);
      setState({
        isOpen: true,
        messages: [],
        isLoading: true,
        anchorPosition,
        initialContext,
      });

      // Send initial question
      await sendMessage(args.question, [], initialContext);
    },
    [sendMessage]
  );

  const closeInlineChat = React.useCallback(() => {
    setState({
      isOpen: false,
      messages: [],
      isLoading: false,
      anchorPosition: null,
      initialContext: undefined,
    });
  }, []);

  const sendFollowUp = React.useCallback(
    async (question: string) => {
      if (!state.isOpen || state.isLoading) return;
      await sendMessage(question, state.messages, state.initialContext);
    },
    [state.isOpen, state.isLoading, state.messages, state.initialContext, sendMessage]
  );

  const setAnchorPosition = React.useCallback((position: { x: number; y: number } | null) => {
    setState((prev) => ({
      ...prev,
      anchorPosition: position,
    }));
  }, []);

  return {
    state,
    openInlineChat,
    closeInlineChat,
    setAnchorPosition,
    sendFollowUp,
  };
}

