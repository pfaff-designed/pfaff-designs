"use client";

import * as React from "react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/atoms/Heading";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";

export default function Contact() {
  const handleSubmit = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Form submission logic will be implemented in Phase 11.2
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg-default)]">
      <Section className="pt-[2rem] md:pt-[3rem] pb-[4rem] md:pb-[6rem]">
        <Container>
          <section className="max-w-xl mx-auto space-y-6">
          <Heading text="Let's talk" variant="display" className="pb-6"/>
            <form onSubmit={handleSubmit} className="space-y-4 pb-6">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium text-[var(--text-default)]">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-[var(--text-default)]">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="subject" className="text-sm font-medium text-[var(--text-default)]">
                  Subject
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="message" className="text-sm font-medium text-[var(--text-default)]">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="w-full border-slate-300"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary">
                  Send message
                </Button>
              </div>
            </form>

            <div className="max-w-xl mx-auto space-y-3">
            <Heading variant="headline" className="text-base font-semibold text-[var(--text-default)]" text="Prefer to book time?" />
            <p className="text-sm text-[var(--text-muted)]">
              Soon you'll be able to grab a slot on my calendar for portfolio reviews,
              collaboration chats, or role discussions.
            </p>
            <Button type="button" variant="primary" disabled>
              Schedule time (coming soon)
            </Button>
          </div>
          </section>
        </Container>
      </Section>
    </main>
  );
}
