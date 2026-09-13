"use client";
import { Sparkles } from "lucide-react";

export function AiInsightBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-stitch-surface-container p-space-lg shadow-xl font-stitch-body">
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-stitch-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex items-start gap-space-md">
        <div className="w-11 h-11 rounded-xl bg-stitch-secondary/15 flex items-center justify-center flex-shrink-0 text-stitch-secondary shadow-inner">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-stitch-heading text-base font-bold text-stitch-on-background">AI Insight</span>
          <p className="text-sm text-stitch-on-surface-variant max-w-3xl">
            Based on your current sales trend, you are projected to increase revenue this month. Consider restocking popular items to meet demand.
          </p>
        </div>
      </div>
    </div>
  );
}