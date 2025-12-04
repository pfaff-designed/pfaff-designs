# Debugging Image Paths

## Issue: 400 Bad Request from Next.js Image

The error indicates that Next.js can't fetch the image from the Supabase URL.

## What to Check

### 1. Verify Folder Names in Supabase Match Registry

The registry expects these **exact** folder names (lowercase, hyphenated):

```
media/
├── capital-one/hero.jpg
├── pmi/hero.jpg
├── tanger/hero.jpg
├── coke/hero.jpg
├── real-estate/hero.jpg
└── rag-portfolio/hero.jpg
```

**If your Supabase folders are named differently** (e.g., "Capital One Travel" instead of "capital-one"), you have two options:

#### Option A: Rename folders in Supabase (Recommended)
- Rename "Capital One Travel" → "capital-one"
- Rename "PMI" → "pmi"
- Rename "Tanger" → "tanger"
- etc.

#### Option B: Update the registry to match your actual folder names
Update `src/lib/media/registry.ts` to match your actual folder names.

### 2. Verify Images Are Actually Uploaded

1. Go to Supabase Dashboard → Storage → `media` bucket
2. Check that each folder exists and contains `hero.jpg`
3. Click on each `hero.jpg` file to verify it loads

### 3. Test URLs Directly

After adding logging, check the browser console for the actual URLs being generated. Then:

1. Copy the URL from console (e.g., `https://ijwldoqqihdtwegdjjwf.supabase.co/storage/v1/object/public/media/capital-one/hero.jpg`)
2. Paste it in a new browser tab
3. If it doesn't load directly, the file doesn't exist at that path
4. If it loads directly but not via Next.js Image, it's a Next.js image optimization issue

### 4. Check Next.js Image Configuration

The `next.config.js` already has `*.supabase.co` in `remotePatterns`, which should be sufficient.

### 5. Common Issues

**Issue: Folder names don't match**
- Registry: `capital-one/hero.jpg`
- Supabase: `Capital One Travel/hero.jpg`
- **Fix**: Rename folders in Supabase or update registry

**Issue: Images not uploaded**
- **Fix**: Upload `hero.jpg` to each folder

**Issue: Wrong file name**
- Registry expects: `hero.jpg` (exact name)
- **Fix**: Ensure files are named exactly `hero.jpg`

**Issue: Bucket not public**
- **Fix**: Make bucket public in Supabase Storage settings

## Debug Logging

I've added console logging that will show:
- The resolved URL for each media ID
- Whether the image is accessible (HTTP HEAD request)
- Any errors during image loading

Check the browser console for these logs to see exactly what's happening.

