"use client";

import { ClipboardList } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No tasks yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Create your first task to get started. Tasks created here will be synced
        with Jira and tracked in this dashboard.
      </p>
    </div>
  );
}
