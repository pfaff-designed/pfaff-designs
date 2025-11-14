import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  try {
    const faviconPath = path.join(process.cwd(), "public", "favicon.svg");
    const svgContent = fs.readFileSync(faviconPath, "utf-8");
    
    return new NextResponse(svgContent, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    // Return a minimal SVG if file doesn't exist
    const minimalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#E76F51"/></svg>`;
    return new NextResponse(minimalSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
      },
    });
  }
}

