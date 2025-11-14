# Tailwind CSS v4 Setup Guide

## Current Setup Status

Your project is using **Tailwind CSS v4.1.17**, which has a different setup than v3. Here's what's configured:

## ✅ What's Already Configured

1. **Dependencies** - Installed:
   - `tailwindcss@^4.1.17`
   - `@tailwindcss/postcss@^4.1.17`
   - `postcss@^8.5.6`

2. **PostCSS Config** (`postcss.config.js`):
   ```js
   module.exports = {
     plugins: {
       "@tailwindcss/postcss": {},
     },
   };
   ```

3. **CSS Import** (`src/app/globals.css`):
   ```css
   @import "tailwindcss";
   ```

4. **Layout Import** (`src/app/layout.tsx`):
   ```tsx
   import "./globals.css";
   ```

5. **Config File** (`tailwind.config.ts`):
   - Content paths configured
   - Theme extensions configured

## 🔧 Steps to Fix (If Not Working)

### Step 1: Verify Dependencies
```bash
npm install -D tailwindcss@^4.1.17 @tailwindcss/postcss@^4.1.17 postcss@^8.5.6
```

### Step 2: Ensure PostCSS Config is Correct
The `postcss.config.js` should only have `@tailwindcss/postcss` (autoprefixer is built-in for v4).

### Step 3: Verify CSS Import
Your `src/app/globals.css` should start with:
```css
@import "tailwindcss";
```

### Step 4: Restart Dev Server
After making changes, restart your Next.js dev server:
```bash
npm run dev
```

### Step 5: Test Tailwind Classes
Try using a simple Tailwind class in a component:
```tsx
<div className="bg-red-500 p-4">Test</div>
```

## 🐛 Troubleshooting

### If Tailwind classes still don't work:

1. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check browser console** for CSS loading errors

3. **Verify the CSS file is being imported** in `layout.tsx`

4. **Check that content paths in `tailwind.config.ts` match your file structure**:
   ```ts
   content: [
     "./src/app/**/*.{ts,tsx}",
     "./src/components/**/*.{ts,tsx}",
     "./src/stories/**/*.{ts,tsx,mdx}",
   ],
   ```

## 📝 Key Differences in Tailwind v4

- Uses `@import "tailwindcss"` instead of `@tailwind` directives
- PostCSS plugin is `@tailwindcss/postcss` instead of `tailwindcss`
- Config file format is similar but some features work differently
- Autoprefixer is built-in, no need to add separately

## ✅ Verification

After setup, you should be able to use Tailwind classes like:
- `bg-red-500`
- `text-lg`
- `p-4`
- `flex`
- `rounded-pill`
- Custom colors like `bg-accent-primary`

