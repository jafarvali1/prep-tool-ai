"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestProject } from "@/lib/api";
import Section from "@/components/layout/Section";
import ProjectCard from "@/components/cards/ProjectCard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { FileText, Plus } from "lucide-react";

interface ProjectsSectionProps {
  sessionId: string;
  onProjectAdded?: () => void;
}

export default function ProjectsSection({
  sessionId,
  onProjectAdded,
}: ProjectsSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await getLatestProject(sessionId);
        if (data && Object.keys(data).length > 0) {
          setProject(data);
        }
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [sessionId]);

  if (loading) {
    return (
      <Section title="Your Projects" description="Showcase your best work">
        <div className="text-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-slate-600 border-t-indigo-600 animate-spin mx-auto" />
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Your Projects"
      description="Document and improve your project explanations"
    >
      {project ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProjectCard
            title={project.product || "Your Project"}
            description={project.business_value || "Click to view and edit your project details"}
            status="completed"
            onPrimaryAction={() => router.push("/project-explanation")}
            onSecondaryAction={() => router.push("/project-explanation")}
            primaryLabel="View & Edit"
            secondaryLabel="Improve"
            icon={<FileText size={24} />}
          />
        </div>
      ) : (
        <EmptyState
          icon={<FileText size={48} />}
          title="No Projects Yet"
          description="Add your first project to get AI feedback and generate case studies"
          action={{
            label: "Add First Project",
            onClick: () => {
              router.push("/project-explanation");
              onProjectAdded?.();
            },
          }}
        />
      )}
    </Section>
  );
}
