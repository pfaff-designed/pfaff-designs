"use client";

import * as React from "react";
import { z } from "zod";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/atoms/Heading";
import { FormField, FormFieldInput, FormFieldTextarea } from "@/components/molecules/FormField";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/components/molecules/Toast";

// Zod schema for contact form validation
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  subject: z.string().max(200, "Subject must be less than 200 characters").optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
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
      
      // Show error toast for validation failures
      const firstError = result.error.issues[0];
      if (firstError) {
        const errorMessage = firstError.message || "Please check your form and try again.";
        showToast("error", errorMessage);
      }
      
      setIsSubmitting(false);
      return;
    }

    // Clear any previous errors
    setErrors({});

    // Simulate form submission (no API call yet - Phase 11.3)
    try {
      // TODO: Phase 11.3 - Call Postmark API here
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
      
      showToast("success", "Your message has been sent! I'll get back to you soon.");
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      showToast("error", "Something went wrong. Please try again later.");
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
          <div className="flex flex-col lg:flex-row lg:gap-16 lg:items-start max-w-7xl mx-auto">
            {/* Contact Form Section */}
            <div className="flex-1 mb-12 lg:mb-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                  label="Name"
                  required
                  error={errors.name}
                  className="space-y-1"
                >
                  <FormFieldInput
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange("name")}
                    error={!!errors.name}
                    className="w-full"
                  />
                </FormField>

                <FormField
                  label="Email"
                  required
                  error={errors.email}
                  className="space-y-1"
                >
                  <FormFieldInput
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    error={!!errors.email}
                    className="w-full"
                  />
                </FormField>

                <FormField
                  label="Subject"
                  error={errors.subject}
                  className="space-y-1"
                >
                  <FormFieldInput
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange("subject")}
                    error={!!errors.subject}
                    className="w-full"
                  />
                </FormField>

                <FormField
                  label="Message"
                  required
                  error={errors.message}
                  className="space-y-1"
                >
                  <FormFieldTextarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange("message")}
                    error={!!errors.message}
                    className="w-full border-slate-300"
                  />
                </FormField>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send message"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Scheduling CTA Section */}
            <div className="flex-1">
              <div className="space-y-3">
                <Heading
                  variant="headline"
                  text="Prefer to book time?"
                  className="text-base font-semibold"
                />
                <p className="text-sm text-[var(--text-muted)]">
                  Soon you'll be able to grab a slot on my calendar for portfolio reviews,
                  collaboration chats, or role discussions.
                </p>
                <Button type="button" variant="primary" disabled>
                  Schedule time (coming soon)
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
