# Supabase Setup Guide

This project uses Supabase for all data and media storage per the architecture specification.

## Environment Variables

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema

The following tables need to be created in your Supabase project:

### 1. `projects` table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  one_liner TEXT NOT NULL,
  client TEXT,
  company TEXT,
  timeframe TEXT NOT NULL,
  role_title TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  summary_short TEXT NOT NULL,
  summary_long TEXT,
  links JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `project_sections` table
```sql
CREATE TABLE project_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_slug TEXT NOT NULL REFERENCES projects(slug) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('context', 'problem', 'solution', 'process', 'outcome', 'reflections')),
  content TEXT NOT NULL,
  key_points TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '[]',
  embedding vector(1536), -- Adjust dimension based on your embedding model
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. `media` table
```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_slug TEXT REFERENCES projects(slug) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL, -- Supabase Storage CDN URL (public or signed)
  thumb_url TEXT,
  -- For automatic URL refresh (recommended for signed URLs that expire):
  storage_bucket TEXT, -- Bucket name (e.g., "media")
  storage_path TEXT, -- File path within bucket (e.g., "projects/capital-one/hero.jpg")
  alt TEXT NOT NULL, -- Required for accessibility
  caption TEXT,
  role TEXT NOT NULL CHECK (role IN ('hero', 'inline', 'gallery', 'step')),
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. `roles` table
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  responsibilities TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  projects TEXT[] DEFAULT '{}', -- Array of project slugs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. `skills` table
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  related_projects TEXT[] DEFAULT '{}', -- Array of project slugs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. `profile` table
```sql
CREATE TABLE profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  headline TEXT,
  summary_short TEXT,
  summary_long TEXT,
  primary_skills TEXT[] DEFAULT '{}',
  tools TEXT[] DEFAULT '{}',
  values TEXT[] DEFAULT '{}',
  contact JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Storage Bucket Setup

1. Create a storage bucket in Supabase (e.g., `media`)
2. Set bucket to public if you want public access
3. Upload media files to the bucket

### Getting Storage URLs

**You don't manually set the URL format** - Supabase automatically generates URLs in this format when you upload files:

```
https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
```

**How to get URLs:**

**Option 1: Using Supabase Dashboard**
1. Upload file to your bucket in Supabase Dashboard
2. Click on the file
3. Copy the "Public URL" - this is the CDN URL you'll use

**Option 2: Using Code (Recommended)**

**For Public Buckets (URLs never expire):**
```typescript
import { uploadFileToStorage } from "@/lib/supabase/storage";

const file = new File([blob], "hero.jpg", { type: "image/jpeg" });
const url = await uploadFileToStorage("media", "projects/capital-one/hero.jpg", file);

await supabase.from("media").insert({
  project_slug: "capital-one",
  type: "image",
  url: url,
  storage_bucket: "media", // Optional but recommended
  storage_path: "projects/capital-one/hero.jpg", // Optional but recommended
  alt: "Capital One project hero image",
  role: "hero",
});
```

**For Private Buckets (Signed URLs - Auto-refreshes):**
```typescript
import { getSignedStorageURL } from "@/lib/supabase/storage";

// After uploading file to private bucket, store path info:
await supabase.from("media").insert({
  project_slug: "capital-one",
  type: "image",
  url: await getSignedStorageURL("media", "projects/capital-one/hero.jpg"), // Initial signed URL
  storage_bucket: "media", // REQUIRED for auto-refresh
  storage_path: "projects/capital-one/hero.jpg", // REQUIRED for auto-refresh
  alt: "Capital One project hero image",
  role: "hero",
});

// URLs are automatically refreshed when retrieving media:
// const media = await getMediaById("media-id"); // URL auto-refreshed if expired
```

**Option 3: Manual URL Construction**
If you know the file path, you can construct it manually:
- Replace `[project-ref]` with your Supabase project reference (found in your project URL)
- Replace `[bucket]` with your bucket name (e.g., "media")
- Replace `[path]` with the file path (e.g., "projects/capital-one/hero.jpg")

Example: `https://xyzabc123.supabase.co/storage/v1/object/public/media/projects/capital-one/hero.jpg`

## Fallback Behavior

If Supabase is not configured, the system will automatically fall back to the legacy filesystem-based KB loader (`knowledge-base/` folder). This allows for gradual migration.

## Migration from Filesystem KB

To migrate your existing `knowledge-base/` data to Supabase:

1. Set up Supabase tables (see above)
2. Create a migration script to import JSON/YAML files
3. Upload media files to Supabase Storage
4. Update media URLs in the `media` table

The system will automatically use Supabase once configured, with graceful fallback to filesystem if Supabase is unavailable.

