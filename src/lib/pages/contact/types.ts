/**
 * Contact Page Content Model
 */

export interface ContactSection {
  eyebrow: string;
  headline: string;
  body: string;
}

export interface ContactPageData {
  intro: ContactSection;
  form: {
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitButtonText: string;
  };
}

