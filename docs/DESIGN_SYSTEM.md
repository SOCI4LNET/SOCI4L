# SOCI4L — Design System

This document defines the **UI/UX rules, component standards, and visual language**
for SOCI4L.  
All UI work **must follow this document** to keep the product consistent, dense, and premium.

---

## 1. Design Principles

- **Dense, not bulky**  
  Interfaces should feel compact, professional, and information-dense.
- **Single responsibility UI**  
  One action per button, one interaction per row.
- **No visual noise**  
  Avoid unnecessary borders, shadows, or oversized components.
- **shadcn-first**  
  Only shadcn UI components are allowed unless explicitly approved.

---

## 2. Component Library

- **UI Framework:** shadcn/ui  
- **Primitives:** Radix UI  
- **Icons:** lucide-react  
- **Styling:** Tailwind CSS (default shadcn tokens)

Custom components must wrap shadcn components, not replace them.

---

## 3. Layout Standards

### Dashboard
- Uses **Radix Sidebar** (left aligned)
- Horizontal tab navigation is NOT allowed
- Sidebar is collapsible on desktop, offcanvas on mobile
- Main content uses consistent max width and padding

### Public Profile
- No sidebar
- Clean, read-only layout
- Limited actions (Share, Copy)

---

## 4. Button System (VERY IMPORTANT)

### Default Rules
- **Never use default button size in dashboard or settings**
- Explicitly set `size` on all buttons

### Button Sizes
| Use Case | Size |
|--------|------|
| Primary actions (Save, Claim, Connect) | `sm` |
| Secondary actions (Cancel, Back, View) | `sm` |
| Inline actions (Copy, Share) | `icon-sm` |
| Tight spaces (Sidebar, dense rows) | `xs` / `icon-xs` |
| Marketing / Landing pages only | `default` |

### Button Variants
- `default` → primary action only
- `secondary` → secondary but important actions
- `outline` → neutral / tertiary actions
- `destructive` → irreversible actions only

### Button Rules
- No full-width buttons unless necessary
- Inline button groups use:
  ```tsx
  className="flex items-center gap-2"
  ```
- Icon buttons must have `aria-label`
- Loading states use `Loader2` icon with `animate-spin`

### Examples
```tsx
// ✅ Correct
<Button size="sm" variant="default">Save Changes</Button>
<Button size="icon-sm" variant="ghost" aria-label="Copy">
  <Copy className="h-4 w-4" />
</Button>

// ❌ Wrong
<Button>Save</Button> // Missing size
<Button size="default">Save</Button> // Too large for dashboard
```

---

## 5. Sidebar Navigation

### Structure
- **SidebarProvider** wraps entire dashboard layout
- **Sidebar** with `side="left" variant="sidebar" collapsible="icon"`
- **SidebarInset** wraps main content
- **SidebarTrigger** in header for mobile/collapse

### Navigation Items
- Use `SidebarMenuButton` with `asChild` and `Link`
- Active state via `isActive` prop (based on query param)
- Each item: Icon + Label in single row
- No duplicate elements or nested buttons

### Example
```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild isActive={currentTab === 'overview'}>
    <Link href={`/dashboard/${address}?tab=overview`}>
      <LayoutDashboard />
      <span>Overview</span>
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
```

---

## 6. Forms & Inputs

### Input Rules
- Use shadcn `Input` component
- Labels use shadcn `Label`
- Form groups use consistent spacing:
  ```tsx
  <div className="space-y-2">
    <Label>Field Name</Label>
    <Input />
  </div>
  ```

### Validation
- Show errors via `Alert` component (not window.alert)
- Use `toast.error()` for inline validation feedback
- Disable submit buttons during validation/loading

---

## 7. Cards & Containers

### Card Usage
- Use for grouped content sections
- Consistent padding: `CardContent` with `space-y-4` or `space-y-6`
- Headers: `CardHeader` with `CardTitle` and `CardDescription`

### Spacing
- Between cards: `gap-4` or `gap-6`
- Inside cards: `space-y-4` for form fields, `space-y-6` for sections

---

## 8. Typography

### Headings
- Page titles: `text-3xl font-bold`
- Section titles: `text-xl font-semibold`
- Card titles: `CardTitle` component (shadcn default)

### Body Text
- Default: shadcn text styles
- Muted text: `text-muted-foreground`
- Addresses: `font-mono text-sm`

---

## 9. Icons

### Icon Library
- **lucide-react** only
- Standard size: `h-4 w-4` for inline icons
- Smaller: `h-3.5 w-3.5` for tight spaces

### Icon Usage
- Always pair with text or provide `aria-label`
- Loading: `Loader2` with `animate-spin`
- Action icons: `Copy`, `Share2`, `Wallet`, `Settings`, etc.

---

## 10. Color & Theming

### Theme
- Dark mode by default (`className="dark"` on `<html>`)
- Use shadcn CSS variables
- No custom color classes unless extending shadcn tokens

### Status Colors
- Success: `toast.success()` (green)
- Error: `toast.error()` or `Alert variant="destructive"` (red)
- Info: `toast.info()` (blue)
- Warning: `toast.warning()` (yellow)

---

## 11. Navigation & Routing

### URL Structure
- Dashboard: `/dashboard/[address]?tab=overview|assets|activity|settings`
- Public profile: `/p/[address]` or `/p/[slug]`
- Deep linking: Always use query params for tab state

### Navigation Rules
- Use `router.push()` or `router.replace()` (not `window.location`)
- Always normalize addresses to lowercase
- Use `router.refresh()` after mutations to update cache

---

## 12. Loading States

### Loading Patterns
- Page-level: `Skeleton` components
- Button-level: `Loader2` icon with disabled state
- Data fetching: Show skeleton until data loads

### Example
```tsx
{loading ? (
  <Skeleton className="h-32 w-full" />
) : (
  <ActualContent />
)}
```

---

## 13. Error Handling

### Error Display
- Use `Alert` component with `variant="destructive"`
- Toast notifications for transient errors
- Never use `window.alert()` or `console.error()` for user-facing errors

### Error States
- Network errors: `toast.error('Failed to load data')`
- Validation errors: Inline `Alert` or toast
- Permission errors: `Alert` with clear message

---

## 14. Avatar & Profile Images

### Avatar Component
- Use shadcn `Avatar` with `AvatarImage` and `AvatarFallback`
- Fallback: First 2-3 characters of address (uppercase)
- Image source: `https://effigy.im/a/{address}.svg`
- Size: `h-9 w-9` for dropdown, adjust as needed

---

## 15. Tables

### Table Usage
- Use shadcn `Table` components
- Headers: `TableHeader` with `TableHead`
- Rows: `TableBody` with `TableRow` and `TableCell`
- Right-aligned numbers: `className="text-right"`

---

## 16. Badges

### Badge Usage
- Status indicators: `Badge` component
- Variants: `default` (primary), `secondary` (muted)
- Use for profile status, visibility, etc.

---

## 17. Dropdown Menus

### Dropdown Structure
- Use shadcn `DropdownMenu` components
- Items: `DropdownMenuItem` with icons
- Separators: `DropdownMenuSeparator`
- Labels: `DropdownMenuLabel` (non-clickable)

### Menu Items
- Always include icons from lucide-react
- Use `router.push()` for navigation
- Close menu on mobile after selection

---

## 18. Responsive Design

### Breakpoints
- Mobile: `< 768px` (sidebar becomes offcanvas)
- Desktop: `>= 768px` (sidebar visible)

### Mobile Rules
- Sidebar: Offcanvas via Sheet component
- Buttons: Same size, but may stack vertically
- Cards: Full width, no grid on mobile

---

## 19. Accessibility

### Required Attributes
- Icon buttons: `aria-label`
- Form inputs: Associated `Label` with `htmlFor`
- Loading states: `disabled` attribute
- Screen readers: `sr-only` for hidden text

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Focus states: shadcn default ring styles
- Tab order: Logical flow

---

## 20. State Management

### Client State
- Use React `useState` for local UI state
- Use `useEffect` for side effects
- Always check `mounted` before rendering client-only components

### Server State
- Fetch with `cache: 'no-store'` for fresh data
- Use `router.refresh()` after mutations
- Normalize addresses to lowercase before API calls

---

## 21. Code Patterns

### Component Structure
```tsx
'use client'

import { useState, useEffect } from 'react'
// ... other imports

export default function Component() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <Skeleton /> // Prevent hydration mismatch
  }
  
  // Component logic
}
```

### Address Normalization
```tsx
// Always normalize addresses
const normalizedAddress = address.toLowerCase()
```

### Query Params
```tsx
const searchParams = useSearchParams()
const currentTab = searchParams.get('tab') || 'overview'
const validTabs = ['overview', 'assets', 'activity', 'settings']
const activeTab = validTabs.includes(currentTab) ? currentTab : 'overview'
```

---

## 22. Forbidden Patterns

### ❌ Never Do
- Use `window.alert()` or `window.confirm()`
- Use default button size in dashboard/settings
- Create custom components that replace shadcn
- Use inline styles (use Tailwind classes)
- Hardcode colors (use CSS variables)
- Nest buttons or interactive elements
- Use horizontal tabs in dashboard
- Skip `aria-label` on icon buttons
- Use `console.log()` for user-facing messages

### ✅ Always Do
- Use shadcn components
- Set explicit button sizes
- Normalize addresses to lowercase
- Use toast notifications for feedback
- Include loading states
- Check `mounted` before client-only renders
- Use `router.push()` for navigation
- Provide `aria-label` for icon buttons

---

## 23. Component Checklist

Before submitting UI changes, verify:

- [ ] All buttons have explicit `size` prop
- [ ] No default button sizes in dashboard/settings
- [ ] All icon buttons have `aria-label`
- [ ] Loading states implemented
- [ ] Error states use `Alert` or `toast`
- [ ] Addresses normalized to lowercase
- [ ] Mobile responsive (sidebar offcanvas)
- [ ] No `window.alert()` or `console.error()` for users
- [ ] All shadcn components imported
- [ ] Spacing uses `gap-2` or `space-y-*` consistently
- [ ] Query params used for deep linking
- [ ] `mounted` check for client-only components

---

## 24. Examples

### Complete Button Group
```tsx
<div className="flex items-center gap-2">
  <Button size="sm" variant="default">Save</Button>
  <Button size="sm" variant="outline">Cancel</Button>
  <Button size="icon-sm" variant="ghost" aria-label="Copy">
    <Copy className="h-4 w-4" />
  </Button>
</div>
```

### Sidebar Navigation Item
```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild isActive={isActive}>
    <Link href={`/dashboard/${address}?tab=settings`}>
      <Settings />
      <span>Settings</span>
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
```

### Card with Form
```tsx
<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
    <CardDescription>Profile configuration</CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    <div className="space-y-2">
      <Label>Field Name</Label>
      <Input />
    </div>
    <Button size="sm" variant="default">Save Changes</Button>
  </CardContent>
</Card>
```

---

## 25. Version History

- **v1.0** (2024-01-22): Initial design system document
  - Button sizing rules
  - Sidebar navigation standards
  - Component library guidelines
  - Accessibility requirements

---

**Last Updated:** 2024-01-22  
**Maintained by:** Development Team
