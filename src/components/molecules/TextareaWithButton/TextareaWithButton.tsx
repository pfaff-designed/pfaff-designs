import * as React from "react";
import { Textarea, type TextareaProps } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

export interface TextareaWithButtonProps extends Omit<TextareaProps, "className"> {
  buttonText?: string;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
  containerClassName?: string;
  textareaClassName?: string;
  buttonClassName?: string;
}

const TextareaWithButton = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithButtonProps
>(
  (
    {
      buttonText = "Send message",
      onButtonClick,
      buttonDisabled,
      containerClassName,
      textareaClassName,
      buttonClassName,
      ...textareaProps
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "flex w-full max-w-[530px] flex-col gap-2",
          containerClassName
        )}
      >
        <Textarea
          ref={ref}
          className={cn("w-full", textareaClassName)}
          {...textareaProps}
        />
        <Button
          type="button"
          variant="primary"
          onClick={onButtonClick}
          disabled={buttonDisabled}
          className={cn("w-full", buttonClassName)}
        >
          {buttonText}
        </Button>
      </div>
    );
  }
);

TextareaWithButton.displayName = "TextareaWithButton";

export { TextareaWithButton };

