/**
 * About Page Content Model
 */

export interface AboutSection {
  eyebrow: string;
  headline: string;
  body: string;
}

export interface AboutPageData {
  sections: AboutSection[];
}

