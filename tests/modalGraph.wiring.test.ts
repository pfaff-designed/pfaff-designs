import { modalGraphApp, type ModalGraphState } from "@/lib/ai/modalGraph";
import { retrieveProjectChunks } from "@/lib/rag/retrieveProjectChunks";

jest.mock("@/lib/rag/retrieveProjectChunks", () => {
  const actual = jest.requireActual("@/lib/rag/retrieveProjectChunks");
  return {
    ...actual,
    retrieveProjectChunks: jest.fn(),
  };
});

jest.mock("@/lib/ai/client", () => ({
  anthropic: {
    messages: {
      create: jest.fn(async () => ({
        content: [{ type: "text", text: "Mock answer from LLM" }],
      })),
    },
  },
}));

const mockedRetrieve = retrieveProjectChunks as jest.MockedFunction<typeof retrieveProjectChunks>;

function buildState(partial: Partial<ModalGraphState>): Partial<ModalGraphState> {
  return {
    question: "test question",
    pagePath: "/",
    history: [],
    debugNotes: [],
    ...partial,
  };
}

describe("modalGraph wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes to answer_direct with strong retrieval and includes retrieved context", async () => {
    mockedRetrieve.mockResolvedValueOnce([
      {
        id: "1",
        text: "retrieved chunk",
        score: 0.9,
        projectId: "capital-one-travel",
        source: "project_longform",
      },
    ]);

    const initial = buildState({
      question: "What tools did you use?",
      pagePath: "/work/capital-one-travel",
      projectSlug: "capital-one-travel",
    });

    const final = (await modalGraphApp.invoke(initial)) as ModalGraphState;

    expect(final.mode).toBe("answer_direct");
    expect(final.contextBlob).toContain("[RETRIEVED_CONTEXT]");
    expect(final.contextBlob).toContain("retrieved chunk");
  });

  it("routes to clarify_then_answer when retrieval is weak", async () => {
    mockedRetrieve.mockResolvedValueOnce([
      {
        id: "w1",
        text: "weak chunk",
        score: 0.05,
        projectId: "pfaff-designs",
        source: "project_longform",
      },
    ]);

    const final = (await modalGraphApp.invoke(
      buildState({
        question: "tell me more about things",
        pagePath: "/",
      })
    )) as ModalGraphState;

    expect(final.mode).toBe("clarify_then_answer");
  });

  it("routes to low_context_fallback when retrieval is empty", async () => {
    mockedRetrieve.mockResolvedValueOnce([]);

    const final = (await modalGraphApp.invoke(
      buildState({
        question: "hello there",
        pagePath: "/",
      })
    )) as ModalGraphState;

    expect(final.mode).toBe("low_context_fallback");
  });
});

