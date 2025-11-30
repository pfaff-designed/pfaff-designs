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
