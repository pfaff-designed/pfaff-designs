# Repository Audit Report
**Date:** December 4, 2025  
**Scope:** Full codebase audit for component registry, atomic design structure, misplaced components, and unused code

---

## Executive Summary

This audit evaluates the codebase against the defined atomic design taxonomy, identifies misplaced components, verifies component registry accuracy, and catalogs unused or redundant code. All findings are documented without making changes to preserve runtime behavior.

**Key Findings:**
- **Misplaced Components:** 3 components need to be moved (Header, Footer → organisms/; CaseStudyHero → page-components/)
- **Oversized Components:** 1 component exceeds size limits (Composer: 330 lines in molecules/)
- **Registry Issues:** 1 import path needs updating after CaseStudyHero move
- **Unused Components:** 8 components require usage verification
- **Atomic Design Compliance:** Atoms and most molecules are correctly structured; organisms/ directory is empty

---

## 1. Component Registry Analysis

### 1.1 Registry Location
- **File:** `src/lib/registry/componentRegistry.ts`
- **Total Registered Components:** 20
- **Registry Users:**
  - `src/components/utility/Renderer/Renderer.tsx` (primary consumer)
  - `src/lib/ai/pipeline.ts`
  - `src/lib/ai/queryHandler.ts`
  - `src/lib/ai/layoutStrategies.ts`

### 1.2 Registry Accuracy

**✅ All registered components exist and are correctly mapped.**

**Registered Components:**
- **Page Components (3):** ContentSection, AnswerBlock, CaseStudyHero
- **Atoms (5):** Heading, BodyText, Eyebrow, ImageContainer, Video
- **Molecules (8):** Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription, ProjectCard, ProjectCardGrid, MediaFigure, SideBySideMedia, MediaGallery
- **Layout (2):** Section, Container

### 1.3 Registry Issues

**⚠️ Import Path Issue:**
- **File:** `src/lib/registry/componentRegistry.ts` (line 17)
- **Current:** `import { CaseStudyHero } from "@/components/templates/CaseStudyHero";`
- **Issue:** After moving CaseStudyHero to `page-components/`, this import will break
- **Action Required:** Update import path after component move

### 1.4 Components Intentionally Not in Registry

These components are correctly excluded because they are:
- **Static UI components:** Button, Input, Select, Textarea, Tag, Metric, PortfolioImage
- **System components:** Header, Footer (navigation - not generative UI)
- **Utility components:** Toast, ImageLightbox, CalendlyEmbed, AIIndicator, Divider, Spacer
- **AI modal components:** Composer (part of ai-modal system)
- **Internal implementation:** ContentBlock (used within ContentSection variants)

**✅ Registry is accurate** - all registered components are intended for generative UI.

---

## 2. Atomic Design Structure Audit

### 2.1 Current Directory Structure

```
src/components/
├── atoms/          ✅ 11 components (all correctly sized)
├── molecules/      ⚠️ 15 components (1 oversized: Composer)
├── organisms/      ❌ EMPTY (should contain Header, Footer)
├── page-components/ ⚠️ 5 components (2 misplaced: Header, Footer)
├── templates/      ⚠️ 1 component (1 misplaced: CaseStudyHero)
├── layout/         ✅ 3 components (correctly outside atomic design)
├── utility/        ✅ 6 components (correctly outside atomic design)
├── ai/            ✅ 4 components (correctly outside atomic design)
├── ai-modal/      ✅ 9 components (correctly outside atomic design)
├── cmdk/          ✅ 5 components (correctly outside atomic design)
├── inline-chat/   ✅ 1 component (correctly outside atomic design)
├── media/         ✅ 1 component (correctly outside atomic design)
└── ui/            ✅ 9 components (correctly outside atomic design)
```

### 2.2 Atoms (`src/components/atoms/`)

**Total:** 11 components

**Registered (5):**
- Heading (60 lines) ✅
- BodyText (79 lines) ✅
- Eyebrow (~30 lines) ✅
- ImageContainer (113 lines) ✅
- Video (71 lines) ✅

**Not Registered (6):**
- Button (67 lines) ✅ - Static UI, correctly excluded
- Input (31 lines) ✅ - Static UI, correctly excluded
- Select (28 lines) ✅ - Static UI, correctly excluded
- Textarea (28 lines) ✅ - Static UI, correctly excluded
- Tag (39 lines) ✅ - Static UI, correctly excluded
- Metric (39 lines) ⚠️ - Potentially unused, needs verification
- PortfolioImage (52 lines) ✅ - Page-specific, correctly excluded

**Assessment:**
- ✅ **All atoms are correctly sized** (< 150 lines)
- ✅ **No state management in atoms** (verified via grep - no useState/useEffect/useCallback)
- ✅ **All are true atoms** (indivisible UI primitives)
- ⚠️ **Metric** - Verify usage or remove

### 2.3 Molecules (`src/components/molecules/`)

**Total:** 15 components

**Registered (8):**
- Card (84 lines) ✅
- CardHeader, CardContent, CardFooter, CardTitle, CardDescription ✅
- ProjectCard (268 lines) ⚠️ - Close to limit but acceptable
- ProjectCardGrid (59 lines) ✅
- MediaFigure ✅
- MediaGallery (72 lines) ✅
- SideBySideMedia ✅

**Not Registered (7):**
- ContentBlock (85 lines) ✅ - Correctly categorized, used internally
- MediaCard (76 lines) ⚠️ - Potentially unused, needs verification
- NavItem ✅ - Used in Header, correctly excluded
- FormField (61 lines) ✅ - Static form component, correctly excluded
- Composer (330 lines) ❌ **OVERSIZED** - Exceeds 250 line limit
- InputWithButton (60 lines) ⚠️ - Potentially unused, needs verification
- TextareaWithButton (60 lines) ⚠️ - Potentially unused, needs verification
- Toast (86 lines) ✅ - Utility component, correctly excluded
- ImageLightbox (64 lines) ✅ - Utility component, correctly excluded

**Assessment:**
- ⚠️ **Composer exceeds size limit** (330 lines > 250 limit)
  - **Recommendation:** Evaluate if Composer belongs in `molecules/` or should be moved to `ai-modal/` or `utility/`
  - **Note:** Composer is part of the AI modal system, so it may be correctly placed outside atomic design
- ✅ **Most molecules are correctly sized** (< 250 lines)
- ⚠️ **3 potentially unused components** need verification

### 2.4 Organisms (`src/components/organisms/`)

**Total:** 0 components

**Assessment:**
- ❌ **EMPTY DIRECTORY** - This is a critical gap
- **Components that should be here:**
  - **Header** (338 lines) - Currently in `page-components/`
    - Composed of: NavItem (molecule), Button (atom), Image (atom), mobile menu logic
    - Reusable across all pages
    - **Action:** Move to `organisms/Header/`
  - **Footer** (205 lines) - Currently in `page-components/`
    - Composed of: Heading (atom), BodyText (atom), Button (atom), Image (atom)
    - Reusable across all pages
    - **Action:** Move to `organisms/Footer/`

**Recommendation:**
- Move Header and Footer to `organisms/` directory
- These are section-level components composed of multiple molecules and atoms
- They are NOT page-specific (used across all pages)

### 2.5 Page Components (`src/components/page-components/`)

**Total:** 5 components

**Registered (3):**
- ContentSection (354 lines) ✅ - Large but acceptable (has many variants)
- AnswerBlock (87 lines) ✅
- CaseStudyHero (78 lines) ⚠️ - Currently in `templates/`, should be here

**Misplaced (2):**
- Header (338 lines) ❌ - Should be in `organisms/` (reusable across pages)
- Footer (205 lines) ❌ - Should be in `organisms/` (reusable across pages)

**Assessment:**
- ⚠️ **2 components are misplaced** (Header, Footer should be organisms)
- ⚠️ **CaseStudyHero is missing** (currently in templates/)

### 2.6 Templates (`src/components/templates/`)

**Total:** 1 component

- CaseStudyHero (78 lines) ❌ **MISPLACED**

**Assessment:**
- ❌ **CaseStudyHero is incorrectly placed**
  - **Current:** `src/components/templates/CaseStudyHero.tsx`
  - **Should be:** `src/components/page-components/CaseStudyHero/CaseStudyHero.tsx`
  - **Reason:** CaseStudyHero contains page-specific content (client, project name, role, description) - it's not a template (deterministic scaffolding)
  - **Action:** Move to `page-components/` and update registry import

### 2.7 Layout (`src/components/layout/`)

**Total:** 3 components

- Section ✅ - Layout primitive, correctly outside atomic design
- Container ✅ - Layout primitive, correctly outside atomic design
- Stack ⚠️ - Potentially unused, needs verification

**Assessment:**
- ✅ **Correctly categorized** - Layout primitives are outside atomic design
- ⚠️ **Stack** - Verify usage

---

## 3. Misplaced Components

### 3.1 Components Requiring Moves

#### 1. Header
- **Current Location:** `src/components/page-components/Header/`
- **Should Move To:** `src/components/organisms/Header/`
- **Reason:** 
  - Reusable across all pages (not page-specific)
  - Composed of multiple molecules (NavItem) and atoms (Button, Image)
  - Section-level component (navigation bar)
  - 338 lines (within organism size range: 200-600 lines)
- **Files to Move:**
  - `Header.tsx`
  - `Header.stories.tsx`
  - `index.ts`
- **Import Updates Required:**
  - `src/app/layout.tsx` (line 3)
  - Any other files importing Header

#### 2. Footer
- **Current Location:** `src/components/page-components/Footer/`
- **Should Move To:** `src/components/organisms/Footer/`
- **Reason:**
  - Reusable across all pages (not page-specific)
  - Composed of multiple atoms (Heading, BodyText, Button, Image)
  - Section-level component (footer section)
  - 205 lines (within organism size range: 200-600 lines)
- **Files to Move:**
  - `Footer.tsx`
  - `Footer.stories.tsx`
  - `index.ts`
- **Import Updates Required:**
  - `src/app/layout.tsx` (line 4)
  - Any other files importing Footer

#### 3. CaseStudyHero
- **Current Location:** `src/components/templates/CaseStudyHero.tsx`
- **Should Move To:** `src/components/page-components/CaseStudyHero/CaseStudyHero.tsx`
- **Reason:**
  - Contains page-specific content (client, project name, role, description)
  - Not a template (templates are deterministic scaffolding without content)
  - Already registered as `page-component` in registry
  - 78 lines (appropriate for page-component)
- **Files to Move:**
  - `CaseStudyHero.tsx` → `CaseStudyHero/CaseStudyHero.tsx`
  - Create `CaseStudyHero/index.ts` for exports
- **Import Updates Required:**
  - `src/lib/registry/componentRegistry.ts` (line 17)
  - Any other files importing CaseStudyHero

### 3.2 Move Summary

**Total Moves Required:** 3 components

1. `page-components/Header/` → `organisms/Header/`
2. `page-components/Footer/` → `organisms/Footer/`
3. `templates/CaseStudyHero.tsx` → `page-components/CaseStudyHero/CaseStudyHero.tsx`

**Import Updates Required:** 3 files minimum
- `src/app/layout.tsx` (Header, Footer)
- `src/lib/registry/componentRegistry.ts` (CaseStudyHero)

---

## 4. Oversized Components

### 4.1 Components Exceeding Size Limits

#### Composer (330 lines)
- **Location:** `src/components/molecules/Composer/Composer.tsx`
- **Size Limit:** 250 lines (molecule limit)
- **Actual Size:** 330 lines
- **Exceeds by:** 80 lines (32% over limit)

**Analysis:**
- Contains state management (useState, useCallback, useRef)
- Complex logic for textarea handling, status display, relative time formatting
- Part of AI modal system (used in `ai-modal/` and `GlobalComposer`)
- May belong outside atomic design entirely

**Recommendations:**
1. **Option A:** Move to `ai-modal/` directory (it's part of the AI modal system)
2. **Option B:** Move to `utility/` directory (it's a utility component for AI interactions)
3. **Option C:** Split into smaller molecules if it must remain in `molecules/`
   - Extract status display logic
   - Extract relative time formatting
   - Keep core composer as molecule

**Recommendation:** **Option A** - Move to `ai-modal/` since it's tightly coupled with the AI modal system.

### 4.2 Components Near Size Limits

#### ProjectCard (268 lines)
- **Location:** `src/components/molecules/ProjectCard/ProjectCard.tsx`
- **Size Limit:** 250 lines (molecule limit)
- **Actual Size:** 268 lines
- **Exceeds by:** 18 lines (7% over limit)

**Assessment:**
- ⚠️ Slightly over limit but acceptable
- Contains tilt animation logic (useState, useCallback, useRef)
- Complex styling logic but still a true molecule
- **Recommendation:** Monitor - consider extracting animation logic if it grows further

#### ContentSection (354 lines)
- **Location:** `src/components/page-components/ContentSection/ContentSection.tsx`
- **Size Limit:** No strict limit for page-components (but > 600 lines would be flagged)
- **Actual Size:** 354 lines
- **Assessment:**
- ✅ Acceptable for a page-component with many variants
- Acts as a router to variant components
- **Recommendation:** No action needed

---

## 5. Duplicate/Redundant Components

### 5.1 Potential Duplicates

**No confirmed duplicates found.** All components serve distinct purposes.

**Components Reviewed:**
- `ImageContainer` vs `PortfolioImage` - Different use cases (generic vs page-specific)
- `Card` vs `MediaCard` - Different purposes (base card vs media-specific card)
- `Input` vs `InputWithButton` - Different compositions (base vs enhanced)

### 5.2 Redundancy Assessment

**✅ No redundant components identified.** All components have clear, distinct purposes.

---

## 6. Unused Components, Dead Files, and Cruft

### 6.1 Potentially Unused Components

**High Confidence Unused:**
1. **Metric** (atom)
   - Location: `src/components/atoms/Metric/`
   - Has stories, but no clear usage found in codebase
   - **Recommendation:** Verify usage or remove

2. **MediaCard** (molecule)
   - Location: `src/components/molecules/MediaCard/`
   - Has stories, but no clear usage found in codebase
   - **Recommendation:** Verify usage or remove

3. **InputWithButton** (molecule)
   - Location: `src/components/molecules/InputWithButton/`
   - Has stories, but no clear usage found in codebase
   - **Recommendation:** Verify usage or remove

4. **TextareaWithButton** (molecule)
   - Location: `src/components/molecules/TextareaWithButton/`
   - Has stories, but no clear usage found in codebase
   - **Recommendation:** Verify usage or remove

5. **AIIndicator** (utility)
   - Location: `src/components/utility/AIIndicator/`
   - Has stories, but no clear usage found in codebase
   - **Recommendation:** Verify usage or remove

6. **Divider** (utility)
   - Location: `src/components/utility/Divider/`
   - Has stories, but no clear usage found in codebase
   - **Recommendation:** Verify usage or remove

7. **Spacer** (utility)
   - Location: `src/components/utility/Spacer/`
   - Has stories, but no clear usage found in codebase
   - **Recommendation:** Verify usage or remove

8. **Stack** (layout)
   - Location: `src/components/layout/Stack/`
   - Has stories, found in Footer/ContentBlock/AiModal stories but unclear if used in production
   - **Recommendation:** Verify usage or mark for removal

### 6.2 Dead Files

**No confirmed dead files found.** All files appear to be part of the codebase structure.

**Note:** Deeper analysis with dependency tracking would be needed to confirm 100% dead files.

### 6.3 Cruft

**Potential Cruft:**
1. **Story files for unused components**
   - If components are removed, their `.stories.tsx` files should also be removed
   - Affects: Metric, MediaCard, InputWithButton, TextareaWithButton, AIIndicator, Divider, Spacer

2. **Test files**
   - `src/components/molecules/Composer/Composer.test.tsx` exists - verify if tests are run

3. **Unused imports or dependencies**
   - Would require deeper static analysis

---

## 7. Summary and Recommendations

### 7.1 Critical Issues (Must Fix)

1. **Move Header to organisms/**
   - Current: `page-components/Header/`
   - Target: `organisms/Header/`
   - Impact: High (used in layout.tsx)

2. **Move Footer to organisms/**
   - Current: `page-components/Footer/`
   - Target: `organisms/Footer/`
   - Impact: High (used in layout.tsx)

3. **Move CaseStudyHero to page-components/**
   - Current: `templates/CaseStudyHero.tsx`
   - Target: `page-components/CaseStudyHero/CaseStudyHero.tsx`
   - Impact: Medium (used in registry)

4. **Update registry import for CaseStudyHero**
   - File: `src/lib/registry/componentRegistry.ts`
   - Update import path after move

### 7.2 High Priority Issues

1. **Composer size violation**
   - Location: `molecules/Composer/` (330 lines > 250 limit)
   - Recommendation: Move to `ai-modal/` or `utility/`
   - Impact: Medium (affects atomic design compliance)

2. **Verify unused components**
   - 8 components need usage verification
   - Impact: Low (cleanup opportunity)

### 7.3 Medium Priority Issues

1. **ProjectCard size monitoring**
   - 268 lines (slightly over 250 limit)
   - Monitor for future growth
   - Impact: Low

2. **Empty organisms/ directory**
   - Will be resolved after moving Header and Footer
   - Impact: Low

### 7.4 Safe Cleanups (Phase B Candidates)

**After verification, these are safe to remove if unused:**
- Unused components: Metric, MediaCard, InputWithButton, TextareaWithButton, AIIndicator, Divider, Spacer, Stack
- Their associated story files
- Unused test files

**These require careful consideration:**
- Composer location (architectural decision)
- ProjectCard size (monitoring)

---

## 8. Action Plan

### Phase A: Critical Moves (Do First)

1. ✅ Create `organisms/` directory structure
2. ✅ Move `Header/` from `page-components/` to `organisms/`
3. ✅ Move `Footer/` from `page-components/` to `organisms/`
4. ✅ Move `CaseStudyHero.tsx` from `templates/` to `page-components/CaseStudyHero/`
5. ✅ Update imports in:
   - `src/app/layout.tsx`
   - `src/lib/registry/componentRegistry.ts`
   - Any other files importing these components

### Phase B: Component Cleanup (After Verification)

1. ⚠️ Verify usage of 8 potentially unused components
2. ⚠️ Remove unused components and their stories
3. ⚠️ Move Composer to appropriate directory (`ai-modal/` or `utility/`)
4. ⚠️ Remove unused test files

### Phase C: Documentation and Monitoring

1. Document atomic design decisions
2. Add size limits to component creation guidelines
3. Set up monitoring for component size violations
4. Document which components are intentionally excluded from registry

---

## 9. Deferred Improvements (Phase C)

Items that require more investigation or architectural decisions:

1. **Dependency Graph Analysis**
   - Build dependency graph to identify truly dead files
   - Identify circular dependencies
   - Find unused imports

2. **Test Coverage Analysis**
   - Identify which components have tests
   - Identify which tests are actually run
   - Remove unused test files

3. **Component Size Monitoring**
   - Add lint rules to prevent oversized components
   - Set up pre-commit hooks for size checks

4. **Atomic Design Guidelines**
   - Create documentation for component placement decisions
   - Add examples of atoms, molecules, organisms, page-components
   - Document when to use each category

---

**End of Audit Report**
