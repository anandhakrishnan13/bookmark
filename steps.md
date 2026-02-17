# Smart Bookmark App – UI Implementation Steps

This document defines the **step-by-step UI construction plan** for the Smart Bookmark App.  
It is **append-only** and must be followed sequentially.  
Do NOT skip steps. Do NOT reorder steps.  

This file focuses **only on UI structure, layout, and interactions**, not backend logic.

---

## Step 1: Application Shell & Layout

### Objective
Create the foundational two-column layout that mirrors the Raindrop.io desktop app.

### Requirements
- Full-height layout (`h-screen`)
- Left sidebar (fixed width)
- Right content area (flex-grow)

### Rules
- Use **shadcn/ui** components only
- Tailwind is allowed only for layout (flex, spacing, width)
- No business logic in layout components

### Deliverables
- App shell component created
- Sidebar and content area visually separated

---

## Step 2: Left Sidebar – Primary Navigation

### Objective
Implement the left sidebar navigation.

### UI Structure

Sidebar (vertical):
- "All Bookmarks" (default selected)
- Divider
- Custom Sections list (initially empty)
- `+` button at the bottom

### Rules
- Sidebar must be scroll-safe
- Active item must have visible selection state
- Keyboard navigation must work

### Deliverables
- Sidebar renders correctly
- "All Bookmarks" visible and clickable
- `+` button anchored at bottom

---

## Step 3: Right Content Area – Bookmark Display

### Objective
Display bookmarks corresponding to the selected section.

### UI Rules
- Use shadcn `Card` for each bookmark
- Grid or list layout (Raindrop-style)
- Empty state when no bookmarks exist

### States to Handle
- Loading
- Empty
- Populated

### Deliverables
- Bookmark list component renders
- Empty state UI implemented

---

## Step 4: Custom Section Creation Flow

### Objective
Allow users to create custom sections via modal interaction.

### Interaction Flow
1. User clicks `+` button
2. Modal opens
3. Modal asks for:
   - Section name (text input)
   - Confirmation (Create / Cancel)
4. On confirm:
   - Section is added to sidebar

### UI Rules
- Use shadcn `Dialog`
- Input must be validated (non-empty)
- Confirm button disabled until valid

### Deliverables
- Modal opens and closes correctly
- Section name validation works
- Sidebar updates after creation

---

## Step 5: Sidebar Section Selection Behavior

### Objective
Enable switching between sections.

### Rules
- Only one section active at a time
- Active section controls right panel content
- Visual highlight must update immediately

### Deliverables
- Section switching works
- UI updates without page reload

---

## Step 6: Raindrop.io UI Parity (STRICT)

### Objective
Replicate Raindrop.io desktop UI behavior and structure.

### Reference
https://github.com/raindropio/app

### Must-Match Elements
- Sidebar spacing and hierarchy
- Minimal icon usage
- Clean typography
- Subtle dividers
- No unnecessary borders

### Forbidden
- Material-style UI
- Over-rounded components
- Excessive colors

### Deliverables
- UI closely resembles Raindrop.io
- Clean, minimal, professional look

---

## Step 7: Non-Functional UI Constraints

### Performance
- No unnecessary re-renders
- Stable keys for lists

### Accessibility
- Keyboard navigation
- Focus trapping in modal

### Consistency
- Same spacing system everywhere
- Same font scale

---




## End of Steps


   