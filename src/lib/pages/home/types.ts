/**
 * Home Page Content Model
 */

export interface HomeSection {
  eyebrow: string;
  headline: string;
  body: string;
}

export interface HomePageData {
  hero: HomeSection;
  selectedWork: {
    eyebrow: string;
    headline: string;
    body: string;
  };
  about: {
    eyebrow: string;
    headline: string;
    body: string;
  };
  welcomeMessage: string;
}

