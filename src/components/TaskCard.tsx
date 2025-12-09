"use client";

import { useState } from "react";
import { ExternalLink, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDate, getStatusColor, getPriorityColor } from "@/lib/utils";
import { toast } from "sonner";

interface TaskWithUser {
  id: string;
  jiraKey: string;
  summary: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  createdBy: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface Transition {
  id: string;
  name: string;
  toStatus: string;
}

interface TaskCardProps {
  task: TaskWithUser;
  onStatusChange: () => void;
  onTaskClick: (task: TaskWithUser) => void;
}

export function TaskCard({ task, onStatusChange, onTaskClick }: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [loadingTransitions, setLoadingTransitions] = useState(false);

  const statusColors = getStatusColor(task.status);
  const jiraUrl = `https://think-huge.atlassian.net/browse/${task.jiraKey}`;

  const fetchTransitions = async () => {
    if (transitions.length > 0) return;

    setLoadingTransitions(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`);
      if (response.ok) {
        const data = await response.json();
        setTransitions(data.transitions || []);
      }
    } catch (error) {
      console.error("Failed to fetch transitions:", error);
    } finally {
      setLoadingTransitions(false);
    }
  };

  const handleStatusChange = async (transitionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transitionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      toast.success("Task status updated");
      onStatusChange();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className="group hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onTaskClick(task)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <a
                href={jiraUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-primary hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {task.jiraKey}
                <ExternalLink className="h-3 w-3" />
              </a>
              <Badge
                variant="secondary"
                className={cn(
                  statusColors.bg,
                  statusColors.text,
                  statusColors.darkBg,
                  statusColors.darkText
                )}
              >
                {task.status}
              </Badge>
            </div>
            <h3 className="font-semibold text-base line-clamp-2">
              {task.summary}
            </h3>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu onOpenChange={(open) => open && fetchTransitions()}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isLoading}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingTransitions ? (
                <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
              ) : transitions.length > 0 ? (
                transitions.map((transition) => (
                  <DropdownMenuItem
                    key={transition.id}
                    onClick={() => handleStatusChange(transition.id)}
                    disabled={isLoading}
                  >
                    {transition.name} → {transition.toStatus}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No transitions available
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={jiraUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Jira
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div
                className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))}
              />
              <span>{task.priority}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span>Created {formatDate(task.createdAt)}</span>
            {task.createdBy.name && (
              <>
                <span>by</span>
                <span className="font-medium">{task.createdBy.name}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
