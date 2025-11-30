import { NextRequest, NextResponse } from "next/server";
import { ServerClient } from "postmark";
import { z } from "zod";

// Disallowed words for message validation (must match client)
const DISALLOWED_WORDS = ["spam", "advertisement"];

// Re-define schema to match client exactly
const contactFormSchema = z.object({
  name: z.string().min(1, "Please enter your name.").max(100, "Name must be less than 100 characters"),
  email: z.string().min(1, "Please enter a valid email address.").email("Please enter a valid email address."),
  subject: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || value.trim().length >= 3,
      "Subject must be at least 3 characters if provided."
    ),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters and not contain disallowed words.")
    .max(2000, "Message must be less than 2000 characters")
    .refine(
      (value) => {
        const lower = value.toLowerCase();
        return !DISALLOWED_WORDS.some((word) => lower.includes(word));
      },
      "Message must be at least 10 characters and not contain disallowed words."
    ),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = contactFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validationResult.data;

    // Get Postmark configuration from environment variables
    // Support both POSTMARK_API_KEY and POSTMARK_SERVER_TOKEN for flexibility
    const postmarkServerToken = process.env.POSTMARK_API_KEY || process.env.POSTMARK_SERVER_TOKEN;
    const postmarkFromEmail = process.env.POSTMARK_FROM_EMAIL || "hello@pfaff.design";
    const postmarkToEmail = process.env.POSTMARK_TO_EMAIL || "charles@pfaff.design";

    if (!postmarkServerToken) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Initialize Postmark client
    const client = new ServerClient(postmarkServerToken);

    // Prepare email content
    const emailSubject = subject || `Contact form submission from ${name}`;
    const emailBody = `
New contact form submission:

Name: ${name}
Email: ${email}
${subject ? `Subject: ${subject}` : ""}

Message:
${message}
    `.trim();

    // Send email via Postmark
    await client.sendEmail({
      From: postmarkFromEmail,
      To: postmarkToEmail,
      Subject: emailSubject,
      TextBody: emailBody,
      ReplyTo: email,
      MessageStream: "outbound",
    });

    return NextResponse.json(
      { success: true, message: "Your message has been sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    // Handle Postmark-specific errors
    if (error && typeof error === "object" && "ErrorCode" in error) {
      const postmarkError = error as { ErrorCode: number; Message: string };
      if (postmarkError.ErrorCode !== 0) {
        return NextResponse.json(
          { error: `Failed to send email: ${postmarkError.Message}` },
          { status: 500 }
        );
      }
    }

    // Handle other errors
    if (error instanceof Error) {
      // Check for common Postmark error patterns
      if (error.message.includes("Invalid") || error.message.includes("unauthorized")) {
        return NextResponse.json(
          { error: "Email service authentication failed. Please check configuration." },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to send message: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while sending your message." },
      { status: 500 }
    );
  }
}

