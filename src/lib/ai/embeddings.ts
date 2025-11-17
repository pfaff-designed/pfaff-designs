import { OpenAIEmbeddings } from "@langchain/openai";

/**
 * Embeddings client for generating vector embeddings
 * Uses OpenAI's text-embedding-3-small model (1536 dimensions)
 * 
 * Requires OPENAI_API_KEY environment variable
 */
export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

