"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getIntroHistory } from "@/lib/api";
import Section from "@/components/layout/Section";
import IntroCard from "@/components/cards/IntroCard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Mic, Plus } from "lucide-react";

interface IntroSectionProps {
  sessionId: string;
}

export default function IntroSection({
  sessionId,
}: IntroSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    const loadIntroHistory = async () => {
      try {
        const data = await getIntroHistory(sessionId);
        const attemptsList =
          data.aiprep_tool_attempts || data.history || data.attempts || [];
        setAttempts(attemptsList);

        // Find best score
        if (attemptsList.length > 0) {
          const scores = attemptsList.map((a: any) => a.score || 0);
          const max = Math.max(...scores);
          setBestScore(max);
        }
      } catch (err) {
        console.error("Failed to load intro history:", err);
      } finally {
        setLoading(false);
      }
    };

    loadIntroHistory();
  }, [sessionId]);

  if (loading) {
    return (
      <Section title="Intro Practice" description="Perfect your self-introduction">
        <div className="text-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-slate-600 border-t-indigo-600 animate-spin mx-auto" />
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Intro Practice"
      description="Record, evaluate, and improve your professional introduction"
    >
      {attempts.length > 0 ? (
        <div className="space-y-6">
          {/* Best Score Badge */}
          {bestScore !== null && bestScore >= 70 && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-sm font-600 text-emerald-800 dark:text-emerald-200">
                ✓ Great! Your best score is {bestScore}/100. Ready to move to interviews!
              </p>
            </div>
          )}

          {/* Attempts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attempts.map((attempt, idx) => (
              <IntroCard
                key={idx}
                title={`Attempt ${idx + 1}`}
                score={attempt.score || 0}
                maxScore={100}
                feedback={attempt.feedback || attempt.evaluation?.feedback}
                status={attempt.score >= 70 ? "completed" : "in-progress"}
                onPractice={() => router.push("/intro")}
                onImprove={() => router.push("/intro")}
                icon={<Mic size={24} />}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Mic size={48} />}
          title="Start Your Intro Practice"
          description="Record your introduction and get instant AI feedback on your performance"
          action={{
            label: "Start Practice",
            onClick: () => router.push("/intro"),
          }}
        />
      )}
    </Section>
  );
}
