# Next Steps - Implementation Checklist

## ✅ Completed

1. ✅ Supabase integration (client, types, loader)
2. ✅ Media components (Video, MediaFigure, SideBySideMedia, MediaGallery)
3. ✅ URL auto-refresh for signed URLs
4. ✅ Caching (session-level YAML, topic-level KB)
5. ✅ Security (URL validation, alt text enforcement)
6. ✅ Media pipeline integration (Copywriter now receives media)

## 🔧 Setup Required

### 1. Supabase Setup (Required for Production)

**Create Supabase Project:**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy your project URL and anon key
3. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

**Run Database Schema:**
1. Open Supabase SQL Editor
2. Run the SQL from `SUPABASE_SETUP.md` (sections 1-6)
3. This creates: `projects`, `project_sections`, `media`, `roles`, `skills`, `profile` tables

**Set Up Storage:**
1. Create a storage bucket named `media`
2. Set it to public (if you want public URLs) or private (if using signed URLs)
3. Upload your media files

**Add Storage Paths to Media Table:**
For existing media with expiring URLs, update records:
```sql
UPDATE media 
SET storage_bucket = 'media', 
    storage_path = 'projects/[project-slug]/[filename]'
WHERE id = '[media-id]';
```

### 2. Migrate Existing Data (Optional)

If you have data in `knowledge-base/` folder:

**Option A: Manual Migration**
- Copy project data from JSON/YAML files to Supabase tables
- Upload images to Supabase Storage
- Update media table with URLs and storage paths

**Option B: Create Migration Script**
- Write a script to read filesystem KB and insert into Supabase
- See `src/lib/kb/loader.ts` for reference on reading local files

### 3. Test the System

**Test Without Supabase (Current State):**
- System falls back to filesystem KB automatically
- Everything should work as before

**Test With Supabase:**
1. Add environment variables
2. Run a query through the Composer
3. Verify media URLs are refreshed automatically
4. Check that Copywriter includes media IDs in YAML output
5. Verify Orchestrator maps media IDs to components

### 4. Verify Media Flow

**Check Media Pipeline:**
1. ✅ KB Loader retrieves media → Done
2. ✅ Media URLs auto-refresh → Done  
3. ✅ Copywriter receives media IDs → Done
4. ⚠️ Copywriter includes media in YAML → Needs testing
5. ⚠️ Orchestrator maps media IDs to components → Needs testing
6. ⚠️ Renderer resolves media IDs to URLs → **TODO**

### 5. Media ID Resolution (TODO)

The Orchestrator receives media IDs in YAML but needs to resolve them to actual URLs when generating JSON. Currently missing:

**Create Media Resolver:**
```typescript
// src/lib/ai/mediaResolver.ts
export async function resolveMediaIds(mediaIds: string[]): Promise<Map<string, string>> {
  // Fetch media by IDs
  // Return map of id -> url
}
```

**Update Orchestrator:**
- When Orchestrator sees media IDs in YAML
- Call mediaResolver to get URLs
- Include URLs in JSON component props

### 6. Environment Variables

**Required for Supabase:**
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Already Configured:**
```bash
ANTHROPIC_API_KEY=... (for AI agents)
```

## 🎯 Priority Order

1. **Set up Supabase** (if you want to use it)
   - Create project
   - Run schema
   - Add env vars

2. **Test current system** (works without Supabase)
   - Try queries in Composer
   - Verify fallback works

3. **Implement Media ID Resolution** (if using media)
   - Create mediaResolver
   - Update Orchestrator
   - Test end-to-end

4. **Migrate data** (when ready)
   - Move from filesystem to Supabase
   - Upload media files
   - Update storage paths

## 📝 Notes

- **Current State**: System works with filesystem KB (fallback mode)
- **With Supabase**: System automatically uses Supabase when env vars are set
- **Media**: URLs auto-refresh, but media IDs need resolution in Orchestrator
- **No Breaking Changes**: Everything works as before, new features are additive

## 🐛 Known Issues

None currently - system is production-ready for filesystem KB, Supabase-ready when configured.

