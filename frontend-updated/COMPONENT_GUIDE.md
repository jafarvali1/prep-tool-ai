# Component Guide & Usage

## UI Components (`components/ui/`)

### Button
Versatile button component with multiple variants.

**Props:**
```tsx
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";  // Default: "primary"
  size?: "sm" | "md" | "lg";                    // Default: "md"
  isLoading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}
```

**Examples:**
```tsx
// Primary button with icon
<Button onClick={handleClick} icon={<ArrowRight size={18} />}>
  Continue
</Button>

// Secondary button, loading state
<Button variant="secondary" isLoading={loading}>
  Saving...
</Button>

// Ghost button (minimal style)
<Button variant="ghost" size="sm">
  View Details
</Button>
```

---

### Card
Flexible card container with sub-components for structure.

**Components:**
- `<Card>` - Main wrapper
- `<CardHeader>` - Top section with optional border
- `<CardBody>` - Main content area
- `<CardFooter>` - Bottom section (typically for actions)

**Example:**
```tsx
<Card>
  <CardHeader>Project Name</CardHeader>
  <CardBody>
    <p>Project description and details</p>
  </CardBody>
  <CardFooter className="flex justify-between">
    <Badge status="completed">Completed</Badge>
    <Button>View</Button>
  </CardFooter>
</Card>
```

---

### Badge
Status indicator with automatic color coding.

**Props:**
```tsx
interface BadgeProps {
  status: "completed" | "in-progress" | "not-started";
  children: string;  // Display text
}
```

**Example:**
```tsx
<Badge status="completed">Completed</Badge>
<Badge status="in-progress">In Progress</Badge>
<Badge status="not-started">Not Started</Badge>
```

---

### EmptyState
Placeholder for empty data states with optional action.

**Props:**
```tsx
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Example:**
```tsx
<EmptyState
  icon={<FileText size={48} />}
  title="No Projects Yet"
  description="Add your first project to get started"
  action={{
    label: "Create Project",
    onClick: () => router.push("/project-explanation")
  }}
/>
```

---

## Layout Components (`components/layout/`)

### DashboardLayout
Wraps pages with sidebar navigation and main content area.

**Props:**
```tsx
interface DashboardLayoutProps {
  children: ReactNode;
  candidateName?: string;
  onLogout?: () => void;
  theme?: "light" | "dark";
  onThemeToggle?: () => void;
}
```

**Example:**
```tsx
<DashboardLayout
  candidateName="John Doe"
  onLogout={handleLogout}
  theme={appState.theme}
  onThemeToggle={() => appState.setTheme(...)}
>
  <h1>Page Content</h1>
</DashboardLayout>
```

---

### Sidebar
Fixed navigation sidebar (desktop) / mobile menu.

**Features:**
- Logo and branding
- Navigation items with active state
- User info card
- Theme toggle
- Logout button
- Responsive: Fixed on desktop, mobile overlay on small screens

---

### Section
Consistent section layout with title and description.

**Props:**
```tsx
interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}
```

**Example:**
```tsx
<Section
  title="Your Projects"
  description="Manage and improve your project explanations"
>
  <ProjectCard {...props} />
</Section>
```

---

## Card Components (`components/cards/`)

### ProjectCard
Displays a single project with action buttons.

**Props:**
```tsx
interface ProjectCardProps {
  title: string;
  description: string;
  status: "completed" | "in-progress" | "not-started";
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  primaryLabel?: string;      // Default: "Continue"
  secondaryLabel?: string;    // Default: "Improve"
  icon?: ReactNode;
}
```

**Smart Behavior:**
- If `status === "completed"`: Primary button shows "View", secondary shows "Edit"
- If `status === "in-progress"`: Only primary "Continue" button shown
- If `status === "not-started"`: Primary "Get Started" button shown

**Example:**
```tsx
<ProjectCard
  title="ML Recommendation Engine"
  description="E-commerce product recommendation system built with TensorFlow"
  status="completed"
  onPrimaryAction={() => router.push("/project-explanation")}
  onSecondaryAction={() => generateImproved()}
  icon={<FileText size={24} />}
/>
```

---

### CaseStudyCard
Displays a generated case study with export option.

**Props:**
```tsx
interface CaseStudyCardProps {
  title: string;
  domain: string;
  lastUpdated?: string;
  status: "completed" | "in-progress" | "not-started";
  onView: () => void;
  onExport?: () => void;
  icon?: ReactNode;
}
```

**Example:**
```tsx
<CaseStudyCard
  title="RAG System Design"
  domain="RAG Systems"
  lastUpdated="2025-01-15"
  status="completed"
  onView={() => viewCaseStudy()}
  onExport={() => exportPDF()}
  icon={<BookOpen size={24} />}
/>
```

---

### IntroCard
Displays intro practice attempt with score.

**Props:**
```tsx
interface IntroCardProps {
  title: string;
  score?: number;
  maxScore?: number;        // Default: 100
  feedback?: string;
  status: "completed" | "in-progress" | "not-started";
  onPractice: () => void;
  onImprove?: () => void;
  icon?: ReactNode;
}
```

**Features:**
- Score display with progress bar
- Color-coded progress: Red (<50), Amber (50-70), Green (≥70)
- Feedback text below score
- Smart buttons based on status

**Example:**
```tsx
<IntroCard
  title="Attempt 1"
  score={78}
  maxScore={100}
  feedback="Great fluency! Work on pacing."
  status="completed"
  onPractice={() => router.push("/intro")}
  onImprove={() => improveIntro()}
  icon={<Mic size={24} />}
/>
```

---

## Section Components (`components/sections/`)

### ProjectsSection
Ready-to-use section for displaying projects.

**Props:**
```tsx
interface ProjectsSectionProps {
  sessionId: string;
  onProjectAdded?: () => void;
}
```

**Features:**
- Automatic data fetching
- Loading state with spinner
- Empty state with CTA
- Single or multiple projects display

**Example:**
```tsx
<ProjectsSection
  sessionId={appState.sessionId}
  onProjectAdded={() => router.refresh()}
/>
```

---

### CaseStudiesSection
Ready-to-use section for case studies.

**Props:**
```tsx
interface CaseStudiesSectionProps {
  sessionId: string;
}
```

**Features:**
- Automatic fetching and filtering
- Grid layout (responsive)
- Empty state with generation CTA
- Export functionality

---

### IntroSection
Ready-to-use section for intro practice.

**Props:**
```tsx
interface IntroSectionProps {
  sessionId: string;
}
```

**Features:**
- Show all attempts
- Display best score
- Success banner when score ≥ 70
- Grid layout of attempts

---

### InterviewTypeSelection
Step-based interview setup wizard.

**Props:**
```tsx
interface InterviewTypeSelectionProps {
  onSelectType: (type: InterviewConfig["type"]) => void;
  onSelectLevel: (level: InterviewConfig["level"]) => void;
  onStart: (config: InterviewConfig) => void;
  currentConfig: InterviewConfig;
}
```

**Steps:**
1. Select interview type (Recruiter, Behavioral, AI Engineer, etc.)
2. Select experience level (Junior, Senior, Staff, Principal)
3. Start interview

**Example:**
```tsx
<InterviewTypeSelection
  currentConfig={config}
  onSelectType={setType}
  onSelectLevel={setLevel}
  onStart={handleStartInterview}
/>
```

---

## State Management

### useAppState Hook
Lightweight app-wide state management.

**Available Methods:**
```tsx
const appState = useAppState();

// State
appState.sessionId
appState.candidateName
appState.introGenerated
appState.projectsGenerated
appState.caseStudiesGenerated
appState.lastVisitedSection
appState.theme

// Methods
appState.markIntroGenerated()
appState.markProjectsGenerated()
appState.markCaseStudiesGenerated()
appState.setLastVisitedSection(section)
appState.setTheme("dark" | "light")

// Lifecycle
appState.mounted  // true when hydrated
```

**Example:**
```tsx
const appState = useAppState();

if (!appState.mounted) return <LoadingSpinner />;

if (!appState.projectsGenerated) {
  // Show empty state
}

appState.markProjectsGenerated();
appState.setTheme("light");
```

---

## Styling

### Tailwind Utilities
- **Spacing**: `p-4`, `mb-6`, `gap-3`, etc.
- **Colors**: `text-gray-900`, `bg-indigo-100`, `border-slate-200`, etc.
- **Responsive**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Dark Mode**: All components include `dark:` variants

### CSS Variables
Used for theme-aware styling:
```css
--bg-primary      /* Main background */
--bg-secondary    /* Secondary background */
--text-primary    /* Main text color */
--text-secondary  /* Secondary text color */
--accent          /* Primary accent color */
--border          /* Border color */
--success         /* Success state color */
--danger          /* Error state color */
```

---

## Common Patterns

### Loading State
```tsx
if (loading) {
  return (
    <div className="text-center py-8">
      <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-slate-600 border-t-indigo-600 animate-spin mx-auto" />
    </div>
  );
}
```

### Empty State Pattern
```tsx
{data.length > 0 ? (
  <div className="grid gap-6">
    {/* Render cards */}
  </div>
) : (
  <EmptyState
    icon={<IconComponent size={48} />}
    title="No data"
    description="Create your first item"
    action={{
      label: "Create",
      onClick: () => {}
    }}
  />
)}
```

### Protected Route Pattern
```tsx
useEffect(() => {
  const sessionId = localStorage.getItem("session_id");
  if (!sessionId) {
    router.push("/setup");
  }
}, [router]);
```

---

## Best Practices

1. **Always use `useAppState()`** for authentication checks
2. **Use `EmptyState`** instead of blank spaces
3. **Add loading states** with spinner or skeleton
4. **Use `DashboardLayout`** for all authenticated pages
5. **Follow naming conventions**: Files kebab-case, components PascalCase
6. **Keep components small** - max ~150 lines
7. **Extract repeated logic** into custom hooks or utilities
8. **Use Tailwind first**, then custom CSS only when needed
9. **Always include dark mode support** with `dark:` prefix
10. **Test responsive behavior** at all breakpoints
