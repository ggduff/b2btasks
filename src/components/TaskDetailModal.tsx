"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ExternalLink,
  Calendar,
  User,
  Clock,
  MessageSquare,
  Send,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cn,
  formatDate,
  formatDateTime,
  getStatusColor,
  getPriorityColor,
} from "@/lib/utils";
import { toast } from "sonner";

interface TaskWithUser {
  id: string;
  jiraKey: string;
  jiraId?: string | null;
  summary: string;
  description: string | null;
  status: string;
  priority: string;
  assignee?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
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

interface Comment {
  id: string;
  jiraCommentId: string;
  authorName: string;
  authorEmail: string | null;
  authorAvatar: string | null;
  body: string;
  jiraCreatedAt: string;
  jiraUpdatedAt: string;
}

interface TaskDetailModalProps {
  task: TaskWithUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: () => void;
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onStatusChange,
}: TaskDetailModalProps) {
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [loadingTransitions, setLoadingTransitions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  const jiraUrl = task
    ? `https://think-huge.atlassian.net/browse/${task.jiraKey}`
    : "";
  const statusColors = task ? getStatusColor(task.status) : null;

  // Fetch transitions and comments when modal opens
  useEffect(() => {
    if (open && task) {
      fetchTransitions();
      fetchComments();
    } else {
      setTransitions([]);
      setComments([]);
      setNewComment("");
      setEditingCommentId(null);
    }
  }, [open, task?.id]);

  const fetchTransitions = async () => {
    if (!task) return;
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

  const fetchComments = async () => {
    if (!task) return;
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleStatusChange = async (transitionId: string) => {
    if (!task) return;
    setIsUpdating(true);
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
      fetchTransitions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;
    setAddingComment(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add comment");
      }

      const comment = await response.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add comment"
      );
    } finally {
      setAddingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!task || !editingContent.trim()) return;
    setSavingEdit(true);
    try {
      const response = await fetch(
        `/api/tasks/${task.id}/comments/${commentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editingContent.trim() }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update comment");
      }

      const updatedComment = await response.json();
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updatedComment : c))
      );
      setEditingCommentId(null);
      setEditingContent("");
      toast.success("Comment updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update comment"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;
    setDeletingCommentId(commentId);
    try {
      const response = await fetch(
        `/api/tasks/${task.id}/comments/${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete comment");
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete comment"
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.body);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <a
              href={jiraUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-primary hover:underline flex items-center gap-1"
            >
              {task.jiraKey}
              <ExternalLink className="h-3 w-3" />
            </a>
            {statusColors && (
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
            )}
          </div>
          <DialogTitle className="text-xl">{task.summary}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Description
              </h4>
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Priority
              </h4>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    getPriorityColor(task.priority)
                  )}
                />
                <span className="text-sm">{task.priority}</span>
              </div>
            </div>

            {/* Status Transition */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Change Status
              </h4>
              <Select
                disabled={
                  loadingTransitions || isUpdating || transitions.length === 0
                }
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingTransitions
                        ? "Loading..."
                        : transitions.length === 0
                        ? "No transitions"
                        : "Select transition"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {transitions.map((transition) => (
                    <SelectItem key={transition.id} value={transition.id}>
                      {transition.toStatus}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            {task.assignee && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Assignee
                </h4>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{task.assignee}</span>
                </div>
              </div>
            )}

            {/* Created By */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Created By
              </h4>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {task.createdBy.name || task.createdBy.email || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created {formatDate(task.createdAt)}</span>
            </div>
            {task.lastSyncedAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Last synced {formatDateTime(task.lastSyncedAt)}</span>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">
                Comments ({comments.length})
              </h4>
            </div>

            {/* Comments List */}
            {loadingComments ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic mb-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 group"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {comment.authorAvatar ? (
                        <Image
                          src={comment.authorAvatar}
                          alt={comment.authorName}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {comment.authorName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(comment.jiraCreatedAt)}
                          </span>
                        </div>

                        {/* Actions */}
                        {editingCommentId !== comment.id && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => startEditing(comment)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                            >
                              {deletingCommentId === comment.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="min-h-[60px] text-sm"
                            disabled={savingEdit}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditComment(comment.id)}
                              disabled={savingEdit || !editingContent.trim()}
                            >
                              {savingEdit ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                              disabled={savingEdit}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {comment.body}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Form */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] text-sm flex-1"
                disabled={addingComment}
              />
              <Button
                size="icon"
                onClick={handleAddComment}
                disabled={addingComment || !newComment.trim()}
                className="self-end"
              >
                {addingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t pt-4">
          <Button variant="outline" asChild>
            <a href={jiraUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Jira
            </a>
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
