"use client";

import { useState } from "react";
import { TaskCard } from "./TaskCard";
import { TaskDetailModal } from "./TaskDetailModal";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskWithUser {
  id: string;
  jiraKey: string;
  jiraId?: string | null;
  summary: string;
  description: string | null;
  status: string;
  priority: string;
  taskType?: string | null;
  assignee?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  partner?: {
    id: string;
    name: string;
    platform: string | null;
    partnerStatus: string;
  } | null;
}

interface TaskListProps {
  tasks: TaskWithUser[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function TaskList({ tasks, isLoading, onRefresh }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<TaskWithUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleTaskClick = (task: TaskWithUser) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleStatusChange = () => {
    onRefresh();
    // Update selected task from refreshed data
    if (selectedTask) {
      const updatedTask = tasks.find((t) => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-5 w-full mb-1" />
            <Skeleton className="h-5 w-3/4 mb-4" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onRefresh}
            onTaskClick={handleTaskClick}
          />
        ))}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
