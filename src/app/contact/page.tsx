"use client";

import * as React from "react";
import { z } from "zod";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/atoms/Heading";
import { FormFieldInput, FormFieldTextarea } from "@/components/molecules/FormField";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/components/molecules/Toast";
import { CalendlyEmbed } from "@/components/utility/CalendlyEmbed";

// Disallowed words for message validation
const DISALLOWED_WORDS = ["spam", "advertisement"];

// Zod schema for contact form validation
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

export default function Contact() {
  const { showToast } = useToast();
  const [formData, setFormData] = React.useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const successRef = React.useRef<HTMLParagraphElement | null>(null);
  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const emailInputRef = React.useRef<HTMLInputElement | null>(null);
  const subjectInputRef = React.useRef<HTMLInputElement | null>(null);
  const messageTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const handleChange = React.useCallback((field: keyof ContactFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = React.useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("submitting");

    // Validate form data
    const result = contactFormSchema.safeParse(formData);

    if (!result.success) {
      // Map Zod errors to field errors
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ContactFormData;
        if (field) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setStatus("error");
      
      // Show error toast for validation failures
      const firstError = result.error.issues[0];
      if (firstError) {
        const errorMessage = firstError.message || "Please check your form and try again.";
        showToast("error", errorMessage);
      }
      
      // Focus on first invalid field
      const firstInvalidField = result.error.issues[0]?.path[0] as keyof ContactFormData;
      if (firstInvalidField === "name" && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (firstInvalidField === "email" && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (firstInvalidField === "subject" && subjectInputRef.current) {
        subjectInputRef.current.focus();
      } else if (firstInvalidField === "message" && messageTextareaRef.current) {
        messageTextareaRef.current.focus();
      }
      
      setIsSubmitting(false);
      return;
    }

    // Clear any previous errors
    setErrors({});

    // Submit form to API
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API validation errors
        if (data.details && Array.isArray(data.details)) {
          const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
          data.details.forEach((issue: { path: (string | number)[]; message: string }) => {
            const field = issue.path[0] as keyof ContactFormData;
            if (field) {
              fieldErrors[field] = issue.message;
            }
          });
          setErrors(fieldErrors);
        }
        
        // Show specific error message from API
        let errorMessage = "Failed to send message.";
        if (data.error === "Email service not configured") {
          errorMessage = "Email service is not configured. Please contact the site administrator.";
        } else if (data.error === "Validation failed") {
          errorMessage = "Please check your form and fix any errors.";
        } else if (data.error === "Failed to send message") {
          errorMessage = "Failed to send message. Please try again later.";
        } else if (data.error) {
          errorMessage = data.error;
        } else {
          errorMessage = "An unexpected error occurred. Please try again.";
        }
        showToast("error", errorMessage);
        return;
      }

      // Success
      setStatus("success");
      showToast("success", "Message sent successfully! I'll get back to you soon.");
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      // Focus on success message for screen readers
      setTimeout(() => {
        successRef.current?.focus();
      }, 10);
    } catch (error) {
      // Network error or other client-side error
      setStatus("error");
      showToast("error", "Failed to send message. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, showToast]);

  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
      <Section className="pt-[6rem] md:pt-[8rem] pb-[2rem] md:pb-[3rem]">
        <Container>
          <Heading text="Let's talk" variant="display" />
        </Container>
      </Section>

              <Section className="pt-[2rem] md:pt-[3rem] pb-[4rem] md:pb-[6rem]">
                <Container>
                  <div className="flex flex-col gap-12 max-w-7xl mx-auto">
                    {/* Contact Form Section */}
                    <div className="w-full">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="name" className="text-sm font-medium text-[var(--text-default)]">
                    Name <span className="text-[color:var(--state-error)] ml-1">*</span>
                  </label>
                  <FormFieldInput
                    ref={nameInputRef}
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange("name")}
                    error={!!errors.name}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    aria-required="true"
                    className="w-full"
                  />
                  {errors.name && (
                    <p id="name-error" className="text-sm text-[color:var(--state-error)] mt-1" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm font-medium text-[var(--text-default)]">
                    Email <span className="text-[color:var(--state-error)] ml-1">*</span>
                  </label>
                  <FormFieldInput
                    ref={emailInputRef}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    error={!!errors.email}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    aria-required="true"
                    className="w-full"
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-[color:var(--state-error)] mt-1" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="subject" className="text-sm font-medium text-[var(--text-default)]">
                    Subject
                  </label>
                  <FormFieldInput
                    ref={subjectInputRef}
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange("subject")}
                    error={!!errors.subject}
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? "subject-error" : undefined}
                    className="w-full"
                  />
                  {errors.subject && (
                    <p id="subject-error" className="text-sm text-[color:var(--state-error)] mt-1" role="alert">
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="message" className="text-sm font-medium text-[var(--text-default)]">
                    Message <span className="text-[color:var(--state-error)] ml-1">*</span>
                  </label>
                  <FormFieldTextarea
                    ref={messageTextareaRef}
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange("message")}
                    error={!!errors.message}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "message-error" : undefined}
                    aria-required="true"
                    className="w-full border-slate-300"
                  />
                  {errors.message && (
                    <p id="message-error" className="text-sm text-[color:var(--state-error)] mt-1" role="alert">
                      {errors.message}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending…" : "Send message"}
                  </Button>
                </div>
                {status === "success" && (
                  <p
                    ref={successRef}
                    role="status"
                    tabIndex={-1}
                    className="text-sm text-[color:var(--state-success)] mt-2"
                  >
                    Thanks for reaching out — your message has been sent.
                  </p>
                )}
              </form>
            </div>

            {/* Calendly Section */}
            <div className="w-full">
              <div className="space-y-3">
                <Heading
                  variant="headline"
                  text="Prefer to book time?"
                  className="text-base font-semibold"
                />
                <p className="text-sm text-[var(--text-muted)]">
                  Grab a slot on my calendar for portfolio reviews,
                  collaboration chats, or role discussions.
                </p>
                {process.env.NEXT_PUBLIC_CALENDLY_URL ? (
                  <CalendlyEmbed
                    url={process.env.NEXT_PUBLIC_CALENDLY_URL}
                  />
                ) : (
                  <div className="p-8 border border-[color:var(--border-subtle)] rounded-lg bg-[color:var(--bg-surface)] text-center">
                    <p className="text-sm text-[color:var(--text-muted)]">
                      Please set <code className="text-xs bg-[color:var(--bg-default)] px-2 py-1 rounded">NEXT_PUBLIC_CALENDLY_URL</code> in your environment variables.
                    </p>
                    <p className="text-xs text-[color:var(--text-muted)] mt-2">
                      Get your URL from Calendly: Event Type → Settings → Add to Website
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
