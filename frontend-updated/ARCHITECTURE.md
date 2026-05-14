# PrepHub Frontend Architecture

## 🏗️ New Architecture Overview

The frontend has been refactored from a page-scattered approach into a modern **dashboard-based system** with a sidebar navigation, reusable components, and better state management.

### Key Changes

#### 1. **Layout Structure**
- **Sidebar Navigation**: Fixed left sidebar with main navigation links (Dashboard, Preparation Hub, Interview)
- **Dashboard Layout**: Wrapper component that handles sidebar + main content area
- **Responsive Design**: Mobile-friendly menu with hamburger button for smaller screens

#### 2. **New Pages**
- `app/dashboard/page.tsx` - Main dashboard with progress pipeline
- `app/preparation-hub/page.tsx` - Consolidated hub for projects, case studies, and intro practice
- `app/interview-select/page.tsx` - Interview type and level selection before starting

#### 3. **Component Structure**

```
components/
├── ui/                          # Reusable UI components
│   ├── Button.tsx              # Button with variants (primary, secondary, ghost)
│   ├── Card.tsx                # Card components (Card, CardHeader, CardBody, CardFooter)
│   ├── Badge.tsx               # Status badge component
│   └── EmptyState.tsx          # Empty state placeholder
│
├── layout/                      # Layout components
│   ├── Sidebar.tsx             # Main sidebar navigation
│   ├── DashboardLayout.tsx     # Dashboard wrapper
│   └── Section.tsx             # Section layout helper
│
├── cards/                       # Reusable card templates
│   ├── ProjectCard.tsx         # Project display card
│   ├── CaseStudyCard.tsx       # Case study display card
│   └── IntroCard.tsx           # Intro practice card
│
└── sections/
    └── InterviewTypeSelection.tsx  # Interview setup component
```

## 🎨 Design System

### Color Palette (Dark Theme - Default)
- **Background**: `#0f172a` (primary), `#111827` (secondary)
- **Cards**: `#111827` with `rgba(139, 92, 246, 0.08)` gradient
- **Accent**: Indigo-600 (`#4f46e5`), transitions to Indigo-400 on hover
- **Borders**: Subtle gray with accent glow on hover

### Component Styling
- **Rounded Corners**: `rounded-2xl` for cards, `rounded-lg` for buttons
- **Hover Effects**: Border glow, shadow lift, smooth transitions
- **Status Badges**: Color-coded (Completed: green, In Progress: amber, Not Started: gray)

## 📊 State Management

### `useAppState` Hook
Lightweight state management using React hooks + localStorage persistence.

**Tracked State:**
```typescript
{
  sessionId: string;
  candidateName: string;
  introGenerated: boolean;
  projectsGenerated: boolean;
  caseStudiesGenerated: boolean;
  lastVisitedSection: "dashboard" | "projects" | "case-studies" | "intro" | null;
  theme: "light" | "dark";
}
```

**Key Functions:**
- `markIntroGenerated()` - Mark intro as generated
- `markProjectsGenerated()` - Mark projects as generated
- `markCaseStudiesGenerated()` - Mark case studies as generated
- `setLastVisitedSection()` - Track user navigation
- `setTheme()` - Toggle light/dark mode

### localStorage Keys
- `session_id` - Current user session
- `candidate_name` - User's name
- `theme` - Light/dark preference
- `app_state` - Persisted app state (serialized JSON)

## 🧩 Component Examples

### Button Component
```tsx
<Button
  variant="primary"      // primary | secondary | ghost
  size="md"             // sm | md | lg
  isLoading={false}
  onClick={() => {}}
  icon={<SomeIcon />}
>
  Click Me
</Button>
```

### Card Component
```tsx
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

### Badge Component
```tsx
<Badge status="completed">Done</Badge>  // completed | in-progress | not-started
```

### ProjectCard
```tsx
<ProjectCard
  title="My Project"
  description="Project details"
  status="completed"
  onPrimaryAction={() => {}}
  onSecondaryAction={() => {}}
  primaryLabel="View"
  secondaryLabel="Edit"
  icon={<FileText />}
/>
```

## 🔄 Navigation Flow

### Dashboard (`/dashboard`)
- Shows pipeline progress (Setup → Prep Hub → Intro → Interviews)
- Quick stats cards for completion status
- Next steps suggestion
- Links to each section

### Preparation Hub (`/preparation-hub`)
- Tabbed interface: Projects | Case Studies | Intro Practice
- Card-based display for each section
- Empty states with CTAs
- Actions: Generate, View, Edit, Improve

### Interview Selection (`/interview-select`)
- Step 1: Choose interview type (Recruiter, Behavioral, AI Engineer, etc.)
- Step 2: Select experience level (Junior, Senior, Staff, Principal)
- Step 3: Start interview

### Sidebar Navigation
- Dashboard - Main overview
- Preparation Hub - Content creation
- Interview - Practice interviews
- User info, theme toggle, logout in footer

## 🚀 Features

### Smart Conditional UI
- **If data exists** → Show "View", "Edit", "Improve"
- **If not** → Show "Generate", "Get Started"
- **If locked** → Show "Locked" badge with explanation

### Continue Where You Left Off
- Tracks `lastVisitedSection` in state
- Can be used to redirect users back to their last active area

### Loading & Empty States
- Skeleton loaders for data fetching
- EmptyState component with helpful CTAs
- Prevents empty screen syndrome

### Micro-interactions
- Smooth transitions on all interactive elements
- Hover effects with shadow and border glow
- Button loading states with spinner
- Success/error toast notifications

## 📱 Responsive Design

### Breakpoints (Tailwind)
- **Mobile** - Full width, stacked layout
- **Tablet (md)** - 2-column grids
- **Desktop (lg)** - 3+ column grids, fixed sidebar

### Mobile Sidebar
- Hidden by default, accessible via floating hamburger button
- Overlay backdrop when open
- Automatic close on navigation

## 🔗 API Integration

All API calls go through `lib/api.ts`:
- `getResumeSummary(sessionId)`
- `getCaseStudyHistory(sessionId)`
- `getIntroHistory(sessionId)`
- `getLatestProject(sessionId)`
- `getFinalReport(sessionId)`

**No API changes** - Backend remains untouched.

## 📝 Code Style

### Naming Conventions
- Components: PascalCase (e.g., `ProjectCard`)
- Files: kebab-case (e.g., `project-card.tsx`)
- Props: camelCase (e.g., `onPrimaryAction`)
- CSS Classes: Descriptive and contextual (e.g., `nav-item-active`)

### React Patterns
- Functional components with hooks
- Server components where possible (`"use client"` only when needed)
- Prop destructuring for clarity
- Conditional rendering with ternary operators

## 🎯 Next Steps / Future Enhancements

1. **Onboarding Flow** - Welcome tour for new users
2. **Progress Analytics** - Charts and detailed progress tracking
3. **Notifications** - Alert system for completion milestones
4. **Settings Page** - User preferences and account management
5. **Offline Support** - Service worker for offline data viewing
6. **Sharing** - Share progress/results with mentors

## 🧪 Testing

When adding new components:
1. Test responsive behavior (mobile, tablet, desktop)
2. Test dark/light theme switching
3. Test loading states
4. Test empty states
5. Test all button interactions
6. Check accessibility (alt text, ARIA labels)

## 📚 Resources

- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/
- Framer Motion: https://www.framer.com/motion/
- React Hot Toast: https://react-hot-toast.com/
