# Phase 11.4 — Contact Form Validation Enhancements and UX Improvements

## 🎯 Goal
Improve the contact form validation and user experience on `/contact` by enhancing client-side validation, adding better UX feedback, and ensuring accessibility compliance.

For this phase:
- ✅ Enhance client-side validation with more detailed error messages and checks
- ✅ Add ARIA attributes and roles for better accessibility
- ✅ Improve the UX by disabling the submit button while submitting and focusing on the first error field on validation failure
- ✅ Maintain the existing server-side validation and email sending logic from Phase 11.3
- ❌ Do **not** change the API route or server-side logic
- ❌ Do **not** introduce any new backend services or external API calls

---

## 0. Files & Structure

You will likely need to update:

- `src/app/contact/page.tsx` — **frontend form** (existing)

---

## 1. Enhance Client-Side Validation

Update the client-side validation schema or logic to:

- Ensure the `subject` field, if provided, is at least 3 characters long (if non-empty)
- Provide clearer, more specific error messages for each field
- Validate that the `message` does not contain any disallowed words (e.g., "spam", "advertisement")

Example error messages:

- Name: "Please enter your name."
- Email: "Please enter a valid email address."
- Subject: "Subject must be at least 3 characters if provided."
- Message: "Message must be at least 10 characters and not contain disallowed words."

---

## 2. Accessibility Improvements

Add the following accessibility features:

- Add `aria-invalid="true"` to inputs with errors
- Link error messages to inputs using `aria-describedby`
- Use proper roles and landmarks for the form and feedback messages
- Automatically focus on the first invalid input after validation failure

---

## 3. UX Improvements

- Disable the submit button while the form is submitting
- Change the submit button text to "Sending…" when submitting
- After a successful submission, focus on the success message for screen readers
- Clear form fields on success
- Maintain inline error messages below each field

---

## 4. Implementation Details

Assuming you have the following state hooks:

```ts
const [values, setValues] = React.useState<ContactFormValues>(/* ... */);
const [errors, setErrors] = React.useState<Partial<Record<keyof ContactFormValues, string>>>({});
const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
const [formError, setFormError] = React.useState<string | null>(null);
```

Update the `handleSubmit` function accordingly, and update the form elements to include the accessibility attributes and behaviors described.

---

## 5. Do NOT

- Modify the `/api/contact` API route or server-side logic
- Add any new pages or routes
- Add AI or complex state management
- Change the visual design beyond what's necessary for accessibility and UX described

---

## ✅ Acceptance Checklist (11.4)

- [ ] Client-side validation includes subject length and disallowed words check
- [ ] Error messages are clear and specific
- [ ] Inputs with errors have `aria-invalid="true"` and proper `aria-describedby`
- [ ] The form and feedback messages use appropriate ARIA roles
- [ ] Submit button disables and changes text while submitting
- [ ] Focus moves to the first invalid input on validation failure
- [ ] Focus moves to success message on successful submission
- [ ] Form fields clear on success
- [ ] No changes to the server-side API
- [ ] No new pages or external dependencies added

Make these Phase 11.4 changes now.

# Phase 11.4 — Contact Form Validation Enhancements and UX Improvements (Updated with Cursor Clarifications)

## 🎯 Goal
Enhance the `/contact` form with improved client-side validation, accessibility compliance, and polished UX—fully aligned with Cursor’s clarifying questions.

For this phase:
- ✅ Strengthen client-side validation (including optional subject length + disallowed words)
- ✅ Improve ARIA accessibility
- ✅ Add refined UX behaviors (disable button, focus management)
- ❌ Do **not** modify server-side API logic from Phase 11.3
- ❌ Do **not** introduce new backend services or routes

---

## 0. Files & Structure

You will update:
- `src/app/contact/page.tsx`

No new files or shared components should be created.

---

## 1. Enhanced Client-Side Validation

### ### 1.1 Schema Requirements (Updated with Clarifications)

Update the Zod schema with **these exact rules and messages**:

```ts
const DISALLOWED_WORDS = ["spam", "advertisement"];

const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, "Please enter your name."),

  email: z
    .string()
    .min(1, "Please enter a valid email address.")
    .email("Please enter a valid email address."),

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
    .refine(
      (value) => {
        const lower = value.toLowerCase();
        return !DISALLOWED_WORDS.some((word) => lower.includes(word));
      },
      "Message must be at least 10 characters and not contain disallowed words."
    ),
});
```

### Key clarifications applied:
- **Disallowed words** use the fixed list: `spam`, `advertisement`.
- Check is **case-insensitive**.
- Error message is exactly:
  > Message must be at least 10 characters and not contain disallowed words.
- **Empty subject is allowed**, validation applies only when a non-empty value is provided.

---

## 2. Accessibility Improvements (Updated per Clarification)

Add the following to each input **directly in the page file** (do NOT modify shared components):

- `aria-invalid={!!errors.fieldName}`
- `aria-describedby="{fieldName}-error"` when an error exists

Each error message should be:

```tsx
<p id="name-error" className="text-xs text-red-500 mt-1">{errors.name}</p>
```

### Screen-reader focus on success
Cursor asked whether to focus the toast or an inline element.

**Do this:**
- Keep the toast if it exists (optional)
- Add a **success message element inside the form** with:
  - `role="status"`
  - `tabIndex={-1}`
  - A `ref` so we can call `successRef.current?.focus()` after submit

The inline `role="status"` element is the accessibility anchor point.

---

## 3. UX Improvements

Enhance the form behavior:

- Disable the button when `status === "submitting"`
- Change button label to **"Sending…"**
- On successful submit:
  - Clear the form fields
  - Set status to `success`
  - Focus the inline success message via `successRef`

---

## 4. Implementing the Changes

### 4.1 Add new state

```ts
const successRef = React.useRef<HTMLParagraphElement | null>(null);
```

### 4.2 Update `handleSubmit`
- Keep all existing steps from Phase 11.3
- After successful API call:
  ```ts
  setStatus("success");
  setValues({ name: "", email: "", subject: "", message: "" });
  setTimeout(() => successRef.current?.focus(), 10);
  ```

---

## 5. Required Inline Success Message

Place this **below the submit button**:

```tsx
{status === "success" && (
  <p
    ref={successRef}
    role="status"
    tabIndex={-1}
    className="text-xs text-emerald-500 mt-2"
  >
    Thanks for reaching out — your message has been sent.
  </p>
)}
```

This is the element that receives focus.

---

## 6. Do NOT

- Change the server-side API route or its validation
- Add any new backend dependencies
- Modify shared UI components (FormField, Input, Label, etc.)
- Introduce new routes or pages
- Introduce AI, modalGraph, or command palette logic

---

## ✅ Acceptance Checklist (11.4)

Cursor, please verify:

### Validation
- [ ] Schema includes optional subject + length rule
- [ ] Schema rejects disallowed words (`spam`, `advertisement`)
- [ ] Error messages match prompt exactly

### Accessibility
- [ ] Each field has correct `aria-invalid` and `aria-describedby`
- [ ] Error elements have stable IDs
- [ ] Inline success message uses `role="status"` and receives focus

### UX
- [ ] Submit button disables during submission
- [ ] Button label changes to **Sending…**
- [ ] Form fields clear on success
- [ ] First invalid field receives focus on validation failure
- [ ] Success message receives focus on successful submit

### Stability
- [ ] No changes to API route logic
- [ ] No new pages, providers, or AI integrations

Make these Phase 11.4 changes now.