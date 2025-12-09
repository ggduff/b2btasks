"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { TaskList } from "@/components/TaskList";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

interface TaskWithUser {
  id: string;
  jiraKey: string;
  summary: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  lastSyncedAt: string | null;
  createdBy: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
        // Get most recent sync time
        const latestSync = data.reduce(
          (latest: Date | null, task: TaskWithUser) => {
            if (!task.lastSyncedAt) return latest;
            const syncDate = new Date(task.lastSyncedAt);
            return !latest || syncDate > latest ? syncDate : latest;
          },
          null
        );
        setLastSynced(latestSync);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchTasks();
    }
  }, [status, router, fetchTasks]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/tasks/sync", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setLastSynced(new Date());
        toast.success(data.message);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Sync failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === "all") return true;
    return task.status.toLowerCase().includes(statusFilter.toLowerCase());
  });

  // Get unique statuses for filter dropdown
  const uniqueStatuses = [...new Set(tasks.map((task) => task.status))];

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">
              Manage your B2B tasks synced with Jira
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CreateTaskDialog onTaskCreated={fetchTasks} />
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status.toLowerCase()}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {lastSynced && (
              <span className="text-xs text-muted-foreground">
                Last synced: {formatDateTime(lastSynced)}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "Syncing..." : "Sync with Jira"}
            </Button>
          </div>
        </div>

        {/* Task List */}
        <TaskList
          tasks={filteredTasks}
          isLoading={isLoading}
          onRefresh={fetchTasks}
        />
      </main>
    </div>
  );
}
