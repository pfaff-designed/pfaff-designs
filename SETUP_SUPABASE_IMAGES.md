# Supabase Image Setup Guide

## ✅ Completed Steps

1. **Media Registry** - Configured with correct Media IDs and Supabase paths
2. **Media Resolver** - Generates public URLs from bucket + path
3. **Project Registry** - All projects have correct `heroImageId` values
4. **MediaImage Component** - Created and wired into case study pages
5. **Bucket Configuration** - Bucket is public ✅

## 📋 Next Steps: Upload Images to Supabase Storage

You need to upload 6 hero images to your Supabase Storage bucket named `"media"`.

### Required Image Paths

Upload the following files to Supabase Storage:

```
bucket: "media"
├── capital-one/
│   └── hero.jpg
├── pmi/
│   └── hero.jpg
├── tanger/
│   └── hero.jpg
├── coke/
│   └── hero.jpg
├── real-estate/
│   └── hero.jpg
└── rag-portfolio/
    └── hero.jpg
```

### How to Upload via Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open Storage**
   - Click "Storage" in the left sidebar
   - Click on the `media` bucket (or create it if it doesn't exist)

3. **Create Folders & Upload Images**
   - Create folders: `capital-one`, `pmi`, `tanger`, `coke`, `real-estate`, `rag-portfolio`
   - Upload `hero.jpg` to each folder with the exact names above

4. **Verify Public Access**
   - Click on the `media` bucket
   - Ensure "Public bucket" toggle is ON
   - This allows public URLs to work without authentication

### Recommended Image Specifications

- **Format**: JPG or PNG
- **Aspect Ratio**: 16:9
- **Minimum Size**: 1200x675px
- **Recommended Size**: 1920x1080px
- **File Size**: < 500KB (optimized for web)
- **Naming**: Must be exactly `hero.jpg` in each folder

## 🧪 Testing

After uploading images, test each case study page:

1. Visit `/work/capital-one-travel` - Should show hero image
2. Visit `/work/pmi-agile-certification` - Should show hero image
3. Visit `/work/tanger-outlets` - Should show hero image
4. Visit `/work/coca-cola-creative-technology` - Should show hero image
5. Visit `/work/real-estate-platform` - Should show hero image
6. Visit `/work/rag-portfolio` - Should show hero image

### Debugging

If images don't load:

1. **Check Browser Console**
   - Look for errors in the console
   - MediaImage component will show error messages

2. **Verify Supabase URLs**
   - The URLs should be in format:
   - `https://[project-ref].supabase.co/storage/v1/object/public/media/[folder]/hero.jpg`

3. **Check Supabase Client Configuration**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` is set in `.env.local`
   - Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in `.env.local`

4. **Test Public URL Directly**
   - Copy the URL from browser console
   - Paste in a new tab to see if image loads directly

## 📝 Notes

- The media registry maps Media IDs to Supabase paths:
  - `hero-capital-one` → `media/capital-one/hero.jpg`
  - `hero-pmi` → `media/pmi/hero.jpg`
  - etc.

- The resolver generates public URLs using `supabase.storage.from(bucket).getPublicUrl(path)`

- All image paths are deterministic and don't require database lookups

- The system gracefully handles missing images (shows placeholder/error message)

## 🔧 Alternative: Upload via Supabase CLI

If you prefer using the CLI:

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Upload images
supabase storage upload media/capital-one/hero.jpg --bucket media --file ./path/to/capital-one-hero.jpg
supabase storage upload media/pmi/hero.jpg --bucket media --file ./path/to/pmi-hero.jpg
# ... repeat for each image
```

