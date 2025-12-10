#!/usr/bin/env tsx
/**
 * Simple script to test if ANTHROPIC_API_KEY is working
 * Usage: npx tsx scripts/tests/test-anthropic-key.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file (Next.js format)
config({ path: resolve(process.cwd(), ".env.local") });

const getApiKey = () => {
  // Try both variable names
  let key = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  
  if (!key) {
    // If not found, try reading .env.local directly (in case it has export statements)
    try {
      const fs = require("fs");
      const path = require("path");
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/export\s+ANTHROPIC_API_KEY=(.+)/);
        if (match) {
          key = match[1].trim().replace(/^["']|["']$/g, "");
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  if (!key) {
    return undefined;
  }
  // Remove surrounding quotes if present
  return key.replace(/^["']|["']$/g, "");
};

async function testAnthropicKey() {
  console.log("🔍 Testing ANTHROPIC_API_KEY...\n");

  const apiKey = getApiKey();

  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY is not set!");
    console.log("\n💡 Set it in one of these ways:");
    console.log("   1. Create a .env.local file in the project root:");
    console.log("      ANTHROPIC_API_KEY=sk-ant-...");
    console.log("   2. Or export it in your shell:");
    console.log("      export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  console.log(`✓ API Key found (length: ${apiKey.length})`);
  console.log(`  First 10 chars: ${apiKey.substring(0, 10)}...`);
  console.log(`  Last 10 chars: ...${apiKey.substring(apiKey.length - 10)}\n`);

  try {
    console.log("🧪 Making test API call to Anthropic...\n");

    const client = new Anthropic({
      apiKey,
    });

    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: "Say 'Hello, API key is working!' in exactly those words.",
        },
      ],
    });

    const content = response.content[0];
    if (content.type === "text") {
      console.log("✅ SUCCESS! API key is working!\n");
      console.log("Response:", content.text);
      console.log("\n🎉 Your ANTHROPIC_API_KEY is valid and ready to use!");
    } else {
      console.error("❌ Unexpected response type:", content);
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ API call failed!\n");
    console.error("Error:", error.message);

    if (error.status === 401) {
      console.error("\n💡 This usually means:");
      console.error("   - The API key is invalid");
      console.error("   - The API key has been revoked");
      console.error("   - The API key format is incorrect");
    } else if (error.status === 429) {
      console.error("\n💡 Rate limit exceeded. Try again in a moment.");
    } else {
      console.error("\n💡 Check your API key at: https://console.anthropic.com/");
    }

    process.exit(1);
  }
}

testAnthropicKey();

