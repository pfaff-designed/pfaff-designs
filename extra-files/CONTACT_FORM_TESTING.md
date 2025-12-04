# Contact Form Testing Guide

## Prerequisites

1. **Environment Variables Setup**
   - Create/update `.env.local` with:
     ```
     POSTMARK_API_KEY=your-server-token-here
     POSTMARK_FROM_EMAIL=hello@pfaff.design
     POSTMARK_TO_EMAIL=charles@pfaff.design
     ```
   - Restart your dev server after adding env vars: `npm run dev`

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

3. **Navigate to Contact Page**
   - Go to `http://localhost:3000/contact`

---

## Test Scenarios

### 1. Client-Side Validation Tests

#### Test: Empty Form Submission
- **Action**: Click "Send message" without filling any fields
- **Expected**:
  - Error toast: "Please enter your name."
  - Name field shows error: "Please enter your name."
  - Name field has red border
  - Focus moves to name input
  - `aria-invalid="true"` on name input
  - `aria-describedby="name-error"` links to error message

#### Test: Name Field Validation
- **Action**: Enter only spaces or leave empty, then submit
- **Expected**: Error "Please enter your name."

#### Test: Email Field Validation
- **Action**: Enter invalid email (e.g., "notanemail"), then submit
- **Expected**:
  - Error toast: "Please enter a valid email address."
  - Email field shows error
  - Focus moves to email input

#### Test: Subject Field Validation (Optional Field)
- **Action**: Enter 1-2 characters in subject, then submit
- **Expected**: 
  - If subject has value but < 3 chars: Error "Subject must be at least 3 characters if provided."
  - If subject is empty: No error (it's optional)

#### Test: Message Field Validation
- **Action**: Enter less than 10 characters, then submit
- **Expected**: Error "Message must be at least 10 characters and not contain disallowed words."

#### Test: Disallowed Words Check
- **Action**: Enter message containing "spam" or "advertisement" (case-insensitive)
- **Expected**: Error "Message must be at least 10 characters and not contain disallowed words."
- **Test cases**:
  - "This is spam" → Should fail
  - "This is SPAM" → Should fail (case-insensitive)
  - "This is an advertisement" → Should fail
  - "This is an Advertisement" → Should fail

#### Test: Field Error Clearing
- **Action**: 
  1. Submit empty form (see errors)
  2. Start typing in a field with an error
- **Expected**: Error clears for that field as you type

---

### 2. Accessibility Tests

#### Test: Screen Reader Navigation
- **Tool**: Use VoiceOver (Mac) or NVDA/JAWS (Windows)
- **Actions**:
  1. Navigate through form fields with Tab
  2. Submit form with errors
  3. Check that error messages are announced
- **Expected**:
   - Required fields announced as "required"
   - Error messages read when field is focused
   - Success message announced after submission

#### Test: Keyboard Navigation
- **Actions**:
  1. Tab through all fields
  2. Submit form with errors
  3. Verify focus moves to first invalid field
- **Expected**: Focus management works correctly

#### Test: ARIA Attributes
- **Tool**: Browser DevTools → Elements tab
- **Check**:
  - Fields with errors have `aria-invalid="true"`
  - Fields with errors have `aria-describedby="field-error"`
  - Required fields have `aria-required="true"`
  - Error messages have `role="alert"`
  - Success message has `role="status"`

---

### 3. Form Submission Tests

#### Test: Successful Submission
- **Prerequisites**: Valid Postmark API key in `.env.local`
- **Action**: Fill all fields correctly and submit
- **Expected**:
  - Button shows "Sending…" and is disabled
  - Success toast appears: "Message sent successfully! I'll get back to you soon."
  - Inline success message appears: "Thanks for reaching out — your message has been sent."
  - Form fields clear
  - Focus moves to success message
  - Check your email inbox (POSTMARK_TO_EMAIL) for the message

#### Test: Network Error Handling
- **Action**: 
  1. Disconnect internet
  2. Fill form and submit
- **Expected**: Error toast: "Failed to send message. Please check your connection and try again."

#### Test: API Validation Errors
- **Action**: 
  1. Temporarily modify API route to return validation error
  2. Submit form
- **Expected**: Field errors appear, error toast shows

#### Test: Postmark API Error
- **Action**: 
  1. Use invalid `POSTMARK_API_KEY` in `.env.local`
  2. Submit form
- **Expected**: Error toast with specific Postmark error message

---

### 4. UI/UX Tests

#### Test: Button States
- **Actions**:
  1. Submit form
  2. Watch button during submission
- **Expected**:
   - Button text changes to "Sending…"
   - Button is disabled during submission
   - Button returns to "Send message" after completion

#### Test: Toast Notifications
- **Actions**: Trigger various validation errors and success
- **Expected**:
  - Toasts appear at top center, below header
  - Success toasts use green color (`--state-success`)
  - Error toasts use red color (`--state-error`)
  - Toasts auto-dismiss after 5 seconds
  - Toasts can be manually dismissed with X button

#### Test: Form Reset on Success
- **Action**: Submit successful form
- **Expected**: All form fields clear after success

---

### 5. Edge Cases

#### Test: Subject Field Edge Cases
- **Test cases**:
  - Empty string → Should pass (optional)
  - Only spaces → Should fail if trimmed length < 3
  - Exactly 3 characters → Should pass
  - 200+ characters → Should fail (max length)

#### Test: Message Field Edge Cases
- **Test cases**:
  - Exactly 10 characters → Should pass
  - 9 characters → Should fail
  - 2000 characters → Should pass
  - 2001 characters → Should fail
  - Contains "spam" anywhere → Should fail
  - Contains "advertisement" anywhere → Should fail

#### Test: Multiple Validation Errors
- **Action**: Submit form with multiple invalid fields
- **Expected**: 
  - All errors shown
  - Focus on first invalid field
  - Toast shows first error message

---

## Quick Test Checklist

- [ ] Empty form submission shows errors
- [ ] Name validation works
- [ ] Email validation works
- [ ] Subject validation (optional, min 3 if provided)
- [ ] Message validation (min 10 chars)
- [ ] Disallowed words detection ("spam", "advertisement")
- [ ] Focus moves to first invalid field
- [ ] ARIA attributes present on invalid fields
- [ ] Error messages have proper IDs and roles
- [ ] Successful submission clears form
- [ ] Success message appears and receives focus
- [ ] Toast notifications work (success and error)
- [ ] Button states work correctly
- [ ] Email actually sends (check inbox)
- [ ] Network errors handled gracefully
- [ ] API errors handled gracefully

---

## Browser DevTools Testing

1. **Console Tab**: Check for any JavaScript errors
2. **Network Tab**: 
   - Verify POST request to `/api/contact`
   - Check response status and body
3. **Elements Tab**: 
   - Inspect ARIA attributes
   - Check error message IDs match `aria-describedby`
4. **Accessibility Tab**: Run Lighthouse accessibility audit

---

## Manual Email Verification

After successful submission:
1. Check the email inbox specified in `POSTMARK_TO_EMAIL`
2. Verify email contains:
   - Name
   - Email
   - Subject (if provided)
   - Message
   - Reply-To set to sender's email

---

## Common Issues to Watch For

1. **Environment Variables Not Loaded**
   - Symptom: "Email service not configured" error
   - Fix: Restart dev server after adding `.env.local`

2. **Postmark API Key Invalid**
   - Symptom: Authentication error in toast
   - Fix: Verify `POSTMARK_API_KEY` is correct

3. **Focus Not Moving**
   - Symptom: Focus doesn't jump to invalid field
   - Fix: Check refs are properly attached

4. **ARIA Attributes Missing**
   - Symptom: Screen reader doesn't announce errors
   - Fix: Verify `aria-invalid` and `aria-describedby` are set

