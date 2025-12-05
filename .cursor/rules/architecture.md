1. Purpose

This portfolio provides:
	1.	Deterministic static pages
	2.	A cinematic AI modal for conversational exploration

AI responses are never inserted into the page itself.
They appear only inside the modal and are cleared when closed.

There are two generation paths:

A. Page Rendering Path (unchanged)

KB → Copywriter YAML → Orchestrator Layout → Renderer → Static Page

B. AI Modal Conversation Path (NEW)

User Input → Frontend State Machine → /api/ai/modal → RAG Pipeline → AI Modal Card


⸻

2. High-Level System Overview

flowchart LR
    User -->|Select text / ⌘K| Frontend
    Frontend --> StateMachine
    StateMachine -->|POST /api/ai/modal| Server
    Server --> Copywriter
    Copywriter --> Orchestrator
    Orchestrator -->|Card Payload JSON| StateMachine
    StateMachine --> AiModal
    AiModal --> User

3. Interaction Entry Points

A. Text Selection → Ask AI Pill
	1.	User selects text inside a ContentSection.
	2.	System shows a floating pill:
	•	Positioned near the bounding rect of the selection.
	3.	Pill appears only when:
	•	Selection is non-empty
	•	Inside a ContentSection
	•	User is not actively typing
	4.	Clicking it dispatches OPEN_FROM_SELECTION.

Mobile behavior:
Text selection events on mobile may trigger the pill at the bottom of the viewport instead of near the highlight due to OS selection handles.

B. Global ⌘K Command (Desktop Only)
	1.	⌘K or Ctrl+K opens the Command Palette.
	2.	User enters a free-form question.
	3.	Submitting dispatches OPEN_FROM_COMMAND.

⸻

4. AI Modal Architecture

The modal is a cinematic overlay rendered above all site content:
	•	Background blur: 12–16px
	•	Dim overlay: 8–12% black
	•	Centered conversation card:
	•	Max width: 680–720px
	•	Max height: 70vh
	•	Internal scroll
	•	Composer at bottom
	•	Multi-turn conversation

No conversation persists beyond close.

⸻

5. State Machine (Complete)

stateDiagram-v2
    [*] --> IDLE

    IDLE --> OPENING: OPEN_FROM_SELECTION / OPEN_FROM_COMMAND

    OPENING --> THINKING: Opening animations complete

    THINKING --> ANSWER_SHOWING: ANSWER_SUCCESS
    THINKING --> ERROR: ANSWER_ERROR
    THINKING --> CLOSING: CLOSE

    ANSWER_SHOWING --> WAITING_FOR_INPUT: Typing finished
    ANSWER_SHOWING --> CLOSING: CLOSE

    WAITING_FOR_INPUT --> THINKING: NEW_QUESTION
    WAITING_FOR_INPUT --> THINKING: ACTION_CLICKED(deep_dive)
    WAITING_FOR_INPUT --> CLOSING: ACTION_CLICKED(navigate/scroll)
    WAITING_FOR_INPUT --> CLOSING: CLOSE

    ERROR --> WAITING_FOR_INPUT: RETRY
    ERROR --> CLOSING: CLOSE

    CLOSING --> IDLE

	6. Visual Behavior Per State

IDLE
	•	Modal not visible
	•	Normal scrolling

OPENING
	•	Backdrop blur + dim animate in
	•	Card fades & scales from 0.96 → 1
	•	Composer disabled

THINKING
	•	Subtle pulsing “Thinking…” indicator
	•	Composer disabled
	•	Hard timeout: 12 seconds
	•	Then move to ERROR state

ANSWER_SHOWING
	•	AI message typed in using typing animation
	•	No user input during typing

WAITING_FOR_INPUT
	•	Composer enabled
	•	Actions visible (max 4 actions)
	•	Accept follow-ups

ERROR

Displayed inline:
	•	Error message
	•	Retry button
	•	Composer still active

CLOSING
	•	Blur/opacity animations out
	•	Card scales down slightly

⸻

7. Scroll Action Behavior

Actions with { type: "scroll" }:
	1.	Modal closes
	2.	After close animation (180–250ms), the frontend runs:

	document.getElementById(target)?.scrollIntoView({
  behavior: "smooth",
  block: "start",
});

	3.	If the target does not exist:
	•	Show toast: “Section not found”
	•	Do nothing else

Scroll animation duration: 400–500ms, ease-out.

⸻

8. Deep Dive Behavior (Detailed)

deep_dive actions are not simple follow-ups.

Deep dives include:
	•	Original message context
	•	Selected text context (if applicable)
	•	The topic attached to the deep dive action

Deep dive rules:
	•	Deep dives reset the headline if the topic shifts significantly
	•	Deep dives append to conversation history like a follow-up
	•	Deep dives DO NOT:
	•	Navigate
	•	Close the modal
	•	Overwrite previous turns

Chaining deep dives

Yes, deep dives can be chained indefinitely.
Context will accumulate until token limits force truncation.

⸻

9. Conversation Context Rules

To prevent token blowout:

Context accumulation strategy

We store only the last N=5 turns (user + AI pairs).

Anything older than 5 turns is truncated.

Truncation strategy

The backend includes in RAG input:
	•	The last 5 turns
	•	The selected text (if any)
	•	The page/section metadata
	•	The user’s immediate question

Token Safety

If context exceeds ~4k tokens, the earliest turns are dropped first.

⸻

10. Error Handling & Recovery

API Errors

If /api/ai/modal returns error:
	•	Transition to ERROR
	•	Display friendly message:
“Something went wrong. Please try again.”

Timeouts

Hard timeout: 12 seconds
	•	Cancel request
	•	Move to ERROR

Retry Logic

Retry button dispatches:
RETRY → THINKING → API request (same payload)

Network Loss

If offline:
	•	Show offline indicator
	•	Block AI requests
	•	Allow modal to remain open

⸻

11. API Contract (Full Request & Response)

POST /api/ai/modal

Request Body

{
  question: string;
  pageId: string;
  sectionId?: string;
  selectedText?: string;
  conversationHistory: {
    role: "user" | "ai";
    text: string;
  }[];
  deepDiveTopic?: string;
}

Response Body

{
  headline: string;
  messages: {
    role: "user" | "ai";
    text: string;
  }[];
  actions: {
    type: "navigate" | "scroll" | "deep_dive";
    label: string;
    target?: string;
    topic?: string;
  }[];
  error?: string;
}


Error Response

{
  error: string;
}

HTTP Status Codes
	•	200: success
	•	400: bad request
	•	408: timeout
	•	500: server error
	•	503: Anthropic upstream failure

Rate Limiting

Default:
5 requests / 10 seconds / user session
If exceeded:
Return 429 with friendly modal error.

⸻

12. “Ask AI About This” Pill Behavior

Positioning
	•	Uses bounding rect of selection
	•	Offsets:
	•	x: +8px
	•	y: -32px (above selection)

Visibility

Pill appears only when:
	•	selection length ≥ 3 chars
	•	selection occurs INSIDE a ContentSection
	•	selection is stable (200ms debounce)
	•	user is not dragging

Disappearance

Pill hides when:
	•	user clicks anywhere else
	•	selection is cleared
	•	user scrolls > 50px
	•	modal opens

Mobile

Mobile selection handles vary by device; fallback:
	•	Pill appears bottom-center of the screen

⸻

13. Mobile Behavior

Modal
	•	Width: 90vw
	•	Height: 80–90vh
	•	Vertical scroll always enabled inside card
	•	Composer remains sticky at bottom

Keyboard
	•	Composer moves above keyboard on iOS
	•	Viewport resizing must be accounted for

Gestures
	•	Swipe-down → close modal
	•	Tap outside → close modal (if not typing)

⸻

14. Performance Considerations

Debounce Input

Composer input debounced by 150ms before enabling submit.

No Optimistic UI

We never show an AI response before it’s actually generated.

Caching

Optional (not yet implemented):
	•	Cache question/answer pairs for 10 minutes
	•	Keyed by (pageId, selectedText, question)

Selection Pill

Debounced by 200ms on selectionchange.

⸻

15. Analytics (Optional, Not Required)

If analytics is added later:
	•	Track modal open event
	•	Track deep_dive usage
	•	Track command palette usage
	•	Track action types selected (navigate/scroll/deep_dive)

No user text should ever be logged.

⸻

16. Action Limits

To avoid overwhelming users:
	•	Max 4 actions at any time
	•	Priority:
	1.	navigate
	2.	scroll
	3.	deep_dive (max 1 deep dive per answer)

⸻

17. Calls to Anthropic

All model interactions use:
	•	LangChain
	•	Supabase embedding retrieval
	•	Anthropic models (Haiku/Sonnet/Opus)

No OpenAI APIs are used.

⸻

End of architecture.md

(This now includes all gaps Cursor pointed out.)