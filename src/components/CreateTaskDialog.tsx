"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PartnerSelector } from "./PartnerSelector";
import { QuickPartnerDialog } from "./QuickPartnerDialog";
import { TASK_TYPES } from "@/lib/partner-utils";

interface CreateTaskDialogProps {
  onTaskCreated: () => void;
}

const PRIORITIES = ["Highest", "High", "Medium", "Low", "Lowest"];
const TASK_TYPE_OPTIONS = Object.entries(TASK_TYPES) as [string, string][];

export function CreateTaskDialog({ onTaskCreated }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [taskType, setTaskType] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string | null | undefined>(undefined);
  const [showQuickPartner, setShowQuickPartner] = useState(false);
  const [partnerError, setPartnerError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!summary.trim()) {
      toast.error("Summary is required");
      return;
    }

    // Partner is required (but can be null for "Other")
    if (partnerId === undefined) {
      setPartnerError(true);
      toast.error("Please select a partner or choose 'Other'");
      return;
    }
    setPartnerError(false);

    setIsLoading(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: summary.trim(),
          description: description.trim() || undefined,
          priority,
          taskType: taskType || null,
          partnerId, // null = "Other", string = specific partner
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }

      const task = await response.json();
      toast.success(`Task ${task.jiraKey} created successfully`);

      // Reset form
      setSummary("");
      setDescription("");
      setPriority("Medium");
      setTaskType("");
      setPartnerId(undefined);
      setPartnerError(false);
      setOpen(false);
      onTaskCreated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create task"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task that will be synced with Jira. The task will be
              labeled with &quot;thinkhuge-b2b-tracker&quot; for tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Partner - First field */}
            <div className="grid gap-2">
              <Label>Partner *</Label>
              <PartnerSelector
                value={partnerId === undefined ? undefined : partnerId}
                onSelect={(id) => {
                  setPartnerId(id);
                  setPartnerError(false);
                }}
                onCreateNew={() => setShowQuickPartner(true)}
                disabled={isLoading}
                hasError={partnerError}
              />
              <p className="text-xs text-muted-foreground">
                Select the partner this task is for, or choose &quot;Other&quot; if not partner-specific.
              </p>
            </div>

            {/* Task Type - Second field */}
            <div className="grid gap-2">
              <Label htmlFor="taskType">Task Type</Label>
              <Select
                value={taskType}
                onValueChange={setTaskType}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task type..." />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPE_OPTIONS.map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="grid gap-2">
              <Label htmlFor="summary">Summary *</Label>
              <Input
                id="summary"
                placeholder="Enter task summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Priority */}
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={setPriority}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <QuickPartnerDialog
        open={showQuickPartner}
        onOpenChange={setShowQuickPartner}
        onPartnerCreated={(id) => {
          setPartnerId(id);
          setPartnerError(false);
        }}
      />
    </Dialog>
  );
}
