import * as React from "react";
import { Input, type InputProps } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

export interface InputWithButtonProps extends Omit<InputProps, "className"> {
  buttonText?: string;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

const InputWithButton = React.forwardRef<
  HTMLInputElement,
  InputWithButtonProps
>(
  (
    {
      buttonText = "Subscribe",
      onButtonClick,
      buttonDisabled,
      containerClassName,
      inputClassName,
      buttonClassName,
      ...inputProps
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "flex w-full max-w-md items-start gap-2",
          containerClassName
        )}
      >
        <Input
          ref={ref}
          className={cn("flex-1", inputClassName)}
          {...inputProps}
        />
        <Button
          type="button"
          variant="primary"
          onClick={onButtonClick}
          disabled={buttonDisabled}
          className={cn("shrink-0", buttonClassName)}
        >
          {buttonText}
        </Button>
      </div>
    );
  }
);

InputWithButton.displayName = "InputWithButton";

export { InputWithButton };

