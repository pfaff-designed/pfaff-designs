"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ContentSection } from "@/components/page-components/ContentSection";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { contactPageData } from "@/lib/pages/contact/data";
import { Renderer } from "@/components/utility/Renderer";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { useAIAnswer } from "@/components/ai/AIAnswerContext";

function ContactForm() {
  const searchParams = useSearchParams();
  const messageParam = searchParams.get("message");
  const { state } = useAIAnswer();
  const { answerLayout, status } = state;
  
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState(messageParam || "");

  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // Form submission logic will be implemented later
      console.log("Form submitted:", { email, message });
    },
    [email, message]
  );

  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
      {/* AI Content - Show when answerLayout is available */}
      {status === "loading" && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <TypingIndicator />
        </div>
      )}

      {answerLayout && (
        <Renderer 
          data={answerLayout} 
          status={status}
          responseId={state.lastUpdatedAt || answerLayout?.page?.id}
          isLatest={true}
        />
      )}

      {/* Static Contact Content - Show when no AI answer or idle */}
      {(!answerLayout || status === "idle") && (
        <>
          {/* Intro Section */}
          <Section className="pt-[6rem] md:pt-[8rem] pb-[4rem] md:pb-[6rem]">
            <Container>
              <div className="max-w-2xl mx-auto">
                <ContentSection
                  variant="default"
                  eyebrow={contactPageData.intro.eyebrow}
                  headline={contactPageData.intro.headline}
                  body={contactPageData.intro.body}
                />
              </div>
            </Container>
          </Section>

          {/* Form Section */}
          <Section className="py-[4rem] md:py-[6rem]">
            <Container>
              <div className="max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-[1.5rem]">
                  <div className="space-y-[0.5rem]">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-[var(--text-default)]"
                    >
                      {contactPageData.form.emailLabel}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={contactPageData.form.emailPlaceholder}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-[0.5rem]">
                    <label
                      htmlFor="message"
                      className="text-sm font-medium text-[var(--text-default)]"
                    >
                      {contactPageData.form.messageLabel}
                    </label>
                    <Textarea
                      id="message"
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={contactPageData.form.messagePlaceholder}
                      className="w-full min-h-[8rem]"
                    />
                  </div>

                  <div className="pt-[0.5rem]">
                    <Button
                      type="submit"
                      variant="default"
                      className="w-full md:w-auto"
                    >
                      {contactPageData.form.submitButtonText}
                    </Button>
                  </div>
                </form>
              </div>
            </Container>
          </Section>
        </>
      )}
    </main>
  );
}

export default function Contact() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--bg-default)]">
        <Section className="pt-[6rem] md:pt-[8rem] pb-[4rem] md:pb-[6rem]">
          <Container>
            <div className="max-w-2xl mx-auto">
              <ContentSection
                variant="default"
                eyebrow={contactPageData.intro.eyebrow}
                headline={contactPageData.intro.headline}
                body={contactPageData.intro.body}
              />
            </div>
          </Container>
        </Section>
      </main>
    }>
      <ContactForm />
    </Suspense>
  );
}

