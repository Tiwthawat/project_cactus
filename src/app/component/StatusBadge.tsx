// src/app/component/StatusBadge.tsx
"use client";

import React from "react";
import { badgeClass, BadgeTone } from "@/app/lib/status";

type Props = {
  label: string;
  tone?: BadgeTone;
  className?: string;
};

export default function StatusBadge({
  label,
  tone = "gray",
  className = "",
}: Props) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 px-3 py-1 rounded-full",
        "text-xs md:text-sm font-semibold",
        "whitespace-nowrap shrink-0",
        badgeClass(tone),
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
