import * as React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export interface BodyTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  body: string;
  variant?: "default" | "muted" | "small";
  richText?: boolean;
  markdown?: boolean;
}

const BodyText = React.forwardRef<HTMLParagraphElement, BodyTextProps>(
  ({ body, variant = "default", richText = false, markdown = false, className, ...props }, ref) => {
    const baseClasses = cn(
      "text-left font-normal leading-[1.5]",
      {
        "text-base text-text-default": variant === "default",
        "text-base text-text-muted": variant === "muted",
        "text-sm text-text-default": variant === "small",
      },
      className
    );

    // Markdown rendering (preferred for AI chat)
    if (markdown) {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(baseClasses, "prose prose-sm max-w-none")}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-0 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">{children}</code>
              ),
              ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
              li: ({ children }) => <li className="pl-1">{children}</li>,
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      );
    }

    // Legacy richText mode (HTML via dangerouslySetInnerHTML)
    if (richText) {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={baseClasses}
          dangerouslySetInnerHTML={{ __html: body }}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        />
      );
    }

    // Plain text mode
    return (
      <p
        ref={ref}
        className={baseClasses}
        {...props}
      >
        {body}
      </p>
    );
  }
);

BodyText.displayName = "BodyText";

export { BodyText };

