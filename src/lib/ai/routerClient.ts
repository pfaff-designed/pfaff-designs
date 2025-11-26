/**
 * Client Helper for Router
 * 
 * Provides a client-side function to call the router API
 */

import type { RouterInput, RouterResult } from "./routerTypes";

/**
 * Call the router API endpoint
 * 
 * @param input - Router input with query and context
 * @returns Router result with structured actions
 */
export async function callRouter(input: RouterInput): Promise<RouterResult> {
  try {
    const response = await fetch("/api/palette", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response isn't JSON, try to get text
        try {
          const text = await response.text();
          errorMessage = text || errorMessage;
        } catch {
          // Fallback to status code
          errorMessage = `HTTP ${response.status}: ${response.statusText || "Unknown error"}`;
        }
      }
      throw new Error(errorMessage);
    }

    const result: RouterResult = await response.json();
    return result;
  } catch (error) {
    console.error("[Router Client] Error calling router:", error);
    throw error;
  }
}

