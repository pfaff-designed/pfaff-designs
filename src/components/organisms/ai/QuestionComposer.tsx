"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface QuestionComposerProps {
  onSubmit: (question: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const QuestionComposer: React.FC<QuestionComposerProps> = ({
  onSubmit,
  isLoading = false,
  placeholder = "Ask a question...",
  className,
}) => {
  const [value, setValue] = React.useState("");

  const handleSubmit = React.useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
    // Keep the value for easier follow-ups (per requirements)
  }, [value, onSubmit]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isLoading) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, isLoading]
  );

  return (
    <div className={cn("max-w-screen-md mx-auto flex gap-2 items-center", className)}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || !value.trim()}
        aria-label="Submit question"
      >
        {isLoading ? "..." : "Ask"}
      </Button>
    </div>
  );
};

