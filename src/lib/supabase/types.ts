/**
 * Database types matching the architecture specification
 * These types represent the Supabase schema
 */

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      project_sections: {
        Row: ProjectSectionRow;
        Insert: ProjectSectionInsert;
        Update: ProjectSectionUpdate;
      };
      media: {
        Row: MediaRow;
        Insert: MediaInsert;
        Update: MediaUpdate;
      };
      roles: {
        Row: RoleRow;
        Insert: RoleInsert;
        Update: RoleUpdate;
      };
      skills: {
        Row: SkillRow;
        Insert: SkillInsert;
        Update: SkillUpdate;
      };
      profile: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
    };
  };
}

// Projects table
export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  one_liner: string;
  client: string | null;
  company: string | null;
  timeframe: string;
  role_title: string;
  skills: string[];
  summary_short: string;
  summary_long: string | null;
  links: Array<{ label: string; url: string }> | null;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = Omit<ProjectRow, "id" | "created_at" | "updated_at">;
export type ProjectUpdate = Partial<Omit<ProjectRow, "id" | "created_at">>;

// Project Sections table (narrative chunks)
export interface ProjectSectionRow {
  id: string;
  project_slug: string;
  section_type: "context" | "problem" | "solution" | "process" | "outcome" | "reflections";
  content: string;
  key_points: string[] | null;
  metrics: Array<{ label: string; value: string; confidence: "high" | "medium" | "low" }> | null;
  embedding: number[] | null; // vector type
  created_at: string;
  updated_at: string;
}

export type ProjectSectionInsert = Omit<ProjectSectionRow, "id" | "created_at" | "updated_at">;
export type ProjectSectionUpdate = Partial<Omit<ProjectSectionRow, "id" | "created_at">>;

// Media table
export interface MediaRow {
  id: string;
  project_slug: string | null;
  type: "image" | "video";
  url: string; // Supabase Storage CDN URL (can be public or signed)
  thumb_url: string | null;
  // Store file path for automatic URL refresh (optional, but recommended for signed URLs)
  storage_path: string | null; // Format: "bucket/path/to/file.jpg"
  storage_bucket: string | null; // Bucket name (e.g., "media")
  alt: string; // Required for accessibility
  caption: string | null;
  role: "hero" | "inline" | "gallery" | "step";
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export type MediaInsert = Omit<MediaRow, "id" | "created_at" | "updated_at">;
export type MediaUpdate = Partial<Omit<MediaRow, "id" | "created_at">>;

// Roles table
export interface RoleRow {
  id: string;
  company: string;
  title: string;
  timeframe: string;
  responsibilities: string[] | null;
  skills: string[] | null;
  projects: string[] | null; // Array of project slugs
  created_at: string;
  updated_at: string;
}

export type RoleInsert = Omit<RoleRow, "id" | "created_at" | "updated_at">;
export type RoleUpdate = Partial<Omit<RoleRow, "id" | "created_at">>;

// Skills table
export interface SkillRow {
  id: string;
  name: string;
  category: string; // e.g., "frontend", "design systems", "ai"
  description: string | null;
  related_projects: string[] | null; // Array of project slugs
  created_at: string;
  updated_at: string;
}

export type SkillInsert = Omit<SkillRow, "id" | "created_at" | "updated_at">;
export type SkillUpdate = Partial<Omit<SkillRow, "id" | "created_at">>;

// Profile table
export interface ProfileRow {
  id: string;
  headline: string | null;
  summary_short: string | null;
  summary_long: string | null;
  primary_skills: string[] | null;
  tools: string[] | null;
  values: string[] | null;
  contact: { email: string; website?: string } | null;
  created_at: string;
  updated_at: string;
}

export type ProfileInsert = Omit<ProfileRow, "id" | "created_at" | "updated_at">;
export type ProfileUpdate = Partial<Omit<ProfileRow, "id" | "created_at">>;

