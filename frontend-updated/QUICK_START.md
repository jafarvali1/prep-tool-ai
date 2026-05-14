# Quick Start Guide - Dashboard UI

## 🚀 What Changed?

Your PrepHub app now has:
- **Modern Sidebar Navigation** - Fixed left sidebar for desktop, mobile hamburger menu
- **Consolidated Hub** - Projects, case studies, and intro practice all in one tabbed page
- **Reusable Components** - Button, Card, Badge, EmptyState, and more
- **Smart State Management** - `useAppState()` hook tracks progress
- **Production UI** - Tailwind + dark mode support out of the box

---

## 🎯 Key Pages

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/dashboard` | Main overview, pipeline progress |
| Preparation Hub | `/preparation-hub` | Projects, case studies, intro (tabbed) |
| Interview Setup | `/interview-select` | Choose interview type & level |
| Interview | `/interview` | Run the actual interview (unchanged) |

---

## 💡 Most Common Tasks

### 1. Display Data on a Page
```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAppState } from "@/lib/useAppState";

export default function MyPage() {
  const router = useRouter();
  const appState = useAppState();

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) router.push("/setup");
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <DashboardLayout
      candidateName={appState.candidateName}
      onLogout={handleLogout}
      theme={appState.theme}
      onThemeToggle={() => appState.setTheme(
        appState.theme === "light" ? "dark" : "light"
      )}
    >
      <h1>Hello, {appState.candidateName}!</h1>
    </DashboardLayout>
  );
}
```

### 2. Add a Card Section
```tsx
import Section from "@/components/layout/Section";
import ProjectCard from "@/components/cards/ProjectCard";

<Section title="My Projects" description="View and manage projects">
  <ProjectCard
    title="ML System"
    description="Recommendation engine"
    status="completed"
    onPrimaryAction={() => router.push("/project-explanation")}
    icon={<FileText size={24} />}
  />
</Section>
```

### 3. Show Empty State
```tsx
import EmptyState from "@/components/ui/EmptyState";
import { Plus } from "lucide-react";

{data.length === 0 ? (
  <EmptyState
    icon={<Plus size={48} />}
    title="No data yet"
    description="Create your first item to get started"
    action={{
      label: "Create",
      onClick: () => router.push("/create")
    }}
  />
) : (
  <div>Render data here</div>
)}
```

### 4. Use Buttons
```tsx
import Button from "@/components/ui/Button";

// Primary
<Button onClick={handleClick}>Click Me</Button>

// With icon
<Button icon={<ArrowRight size={18} />}>Continue</Button>

// Secondary
<Button variant="secondary">Cancel</Button>

// Ghost (minimal)
<Button variant="ghost" size="sm">View</Button>

// Loading
<Button isLoading={loading}>Saving...</Button>
```

### 5. Create Cards
```tsx
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>
    <p>Content goes here</p>
  </CardBody>
  <CardFooter className="flex justify-between">
    <Badge status="completed">Done</Badge>
    <Button>View</Button>
  </CardFooter>
</Card>
```

### 6. Check State
```tsx
const appState = useAppState();

if (!appState.mounted) return <Spinner />;

if (appState.introGenerated) {
  // Show results
} else {
  // Show empty state
}

// Mark as generated
appState.markIntroGenerated();
```

---

## 📁 File Locations

**UI Components** → `components/ui/`
- Button.tsx, Card.tsx, Badge.tsx, EmptyState.tsx

**Layout Components** → `components/layout/`
- Sidebar.tsx, DashboardLayout.tsx, Section.tsx

**Card Templates** → `components/cards/`
- ProjectCard.tsx, CaseStudyCard.tsx, IntroCard.tsx

**Reusable Sections** → `components/sections/`
- ProjectsSection.tsx, CaseStudiesSection.tsx, IntroSection.tsx

**Hooks** → `lib/`
- useAppState.ts (state management)

**Pages** → `app/`
- dashboard/page.tsx, preparation-hub/page.tsx, interview-select/page.tsx

---

## 🎨 Tailwind Classes Quick Ref

```tsx
// Spacing
p-4 m-6 mb-8 gap-3 px-6 py-4

// Colors
text-gray-900 dark:text-white
bg-indigo-100 dark:bg-indigo-900/30
border-gray-200 dark:border-slate-700

// Layout
flex items-center justify-between
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
flex-1 flex-shrink-0

// Text
text-sm font-bold
text-gray-600 dark:text-gray-400
truncate text-center

// Responsive
md:flex-row  // Flex row on medium+ screens
lg:grid-cols-3  // 3 columns on large+ screens
hidden lg:block  // Show only on large screens
```

---

## 🎭 Dark Mode

All components auto-support dark mode via `data-theme="dark"`.

```tsx
// Use dark: prefix for dark mode styles
<div className="bg-white dark:bg-slate-900">
  <p className="text-gray-900 dark:text-white">Text</p>
</div>

// Toggle theme
appState.setTheme("dark"); // or "light"
```

---

## 🧪 Debugging

### Check if session exists
```tsx
const sid = localStorage.getItem("session_id");
console.log("Session ID:", sid);
```

### Check app state
```tsx
const appState = useAppState();
console.log("App State:", {
  mounted: appState.mounted,
  sessionId: appState.sessionId,
  theme: appState.theme,
  lastSection: appState.lastVisitedSection,
});
```

### Check theme
```tsx
const theme = document.documentElement.getAttribute("data-theme");
console.log("Current theme:", theme);
```

---

## ⚠️ Common Mistakes

### ❌ Forgetting "use client"
```tsx
// ❌ Won't work - missing "use client"
export default function Page() {
  const [state, setState] = useState(false); // Error!
}

// ✅ Correct
"use client";
export default function Page() {
  const [state, setState] = useState(false); // OK!
}
```

### ❌ Not using useAppState
```tsx
// ❌ Manual session checking
const sid = localStorage.getItem("session_id");

// ✅ Use the hook
const appState = useAppState();
const sid = appState.sessionId;
```

### ❌ Not wrapping authenticated pages
```tsx
// ❌ No protection
export default function Page() {
  return <h1>Content</h1>;
}

// ✅ Protected with DashboardLayout
export default function Page() {
  return (
    <DashboardLayout {...props}>
      <h1>Content</h1>
    </DashboardLayout>
  );
}
```

### ❌ Wrong component path
```tsx
// ❌ Wrong
import Button from "@/components/Button";

// ✅ Correct
import Button from "@/components/ui/Button";
```

---

## 📚 Read These Docs

1. **ARCHITECTURE.md** - Full system design and patterns
2. **COMPONENT_GUIDE.md** - Detailed component APIs with examples
3. **REFACTOR_SUMMARY.md** - What changed and why

---

## 🎓 Real Example: Create a New Page

Want to add a new page? Here's the template:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Section from "@/components/layout/Section";
import ProjectsSection from "@/components/sections/ProjectsSection";
import Button from "@/components/ui/Button";
import { useAppState } from "@/lib/useAppState";
import { Plus } from "lucide-react";

export default function NewPage() {
  const router = useRouter();
  const appState = useAppState();

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) router.push("/setup");
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <DashboardLayout
      candidateName={appState.candidateName}
      onLogout={handleLogout}
      theme={appState.theme}
      onThemeToggle={() => appState.setTheme(
        appState.theme === "light" ? "dark" : "light"
      )}
    >
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Page Title
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Page description goes here
        </p>
      </div>

      {/* Main Content */}
      <Section title="Section Title" description="Optional description">
        {/* Your content here */}
      </Section>
    </DashboardLayout>
  );
}
```

---

## ✅ Done!

You now have a modern, production-ready dashboard. Start building! 🚀
