"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCaseStudyHistory } from "@/lib/api";
import Section from "@/components/layout/Section";
import CaseStudyCard from "@/components/cards/CaseStudyCard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { BookOpen, Plus } from "lucide-react";

interface CaseStudiesSectionProps {
  sessionId: string;
}

export default function CaseStudiesSection({
  sessionId,
}: CaseStudiesSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [caseStudies, setCaseStudies] = useState<any[]>([]);

  useEffect(() => {
    const loadCaseStudies = async () => {
      try {
        const data = await getCaseStudyHistory(sessionId);
        const cs = data.aiprep_tool_case_studies || data.case_studies || [];
        setCaseStudies(cs);
      } catch (err) {
        console.error("Failed to load case studies:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCaseStudies();
  }, [sessionId]);

  if (loading) {
    return (
      <Section title="Case Studies" description="Master common domains">
        <div className="text-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-slate-600 border-t-indigo-600 animate-spin mx-auto" />
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Case Studies"
      description="Generate and master domain-specific case studies"
    >
      {caseStudies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map((cs, idx) => (
            <CaseStudyCard
              key={idx}
              title={cs.domain || cs.title || `Case Study ${idx + 1}`}
              domain={cs.domain || "Custom"}
              lastUpdated={
                cs.created_at
                  ? new Date(cs.created_at).toLocaleDateString()
                  : undefined
              }
              status="completed"
              onView={() => router.push(`/case-study?id=${idx}`)}
              onExport={() => {
                // PDF export would be implemented here
                console.log("Export case study:", cs);
              }}
              icon={<BookOpen size={24} />}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="No Case Studies Yet"
          description="Complete your project explanation to generate case studies"
          action={{
            label: "Generate Case Study",
            onClick: () => router.push("/case-study"),
          }}
        />
      )}
    </Section>
  );
}
