import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Select } from "@/components/atoms/Select";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, helpText, required, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col", className)} {...props}>
        <label className="text-sm font-medium text-text-default mb-1">
          {label}
          {required && <span className="text-state-error ml-1">*</span>}
        </label>
        {children}
        {error ? (
          <span className="text-sm text-state-error mt-1">{error}</span>
        ) : helpText ? (
          <span className="text-sm text-text-muted mt-1">{helpText}</span>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = "FormField";

// Helper components for common form field types
const FormFieldInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & { error?: boolean }
>(({ error, ...props }, ref) => {
  return <Input ref={ref} error={error} {...props} />;
});
FormFieldInput.displayName = "FormFieldInput";

const FormFieldTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea> & { error?: boolean }
>(({ error, ...props }, ref) => {
  return <Textarea ref={ref} error={error} {...props} />;
});
FormFieldTextarea.displayName = "FormFieldTextarea";

const FormFieldSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<typeof Select> & { error?: boolean }
>(({ error, ...props }, ref) => {
  return <Select ref={ref} error={error} {...props} />;
});
FormFieldSelect.displayName = "FormFieldSelect";

export { FormField, FormFieldInput, FormFieldTextarea, FormFieldSelect };

