import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
  darkBg: string;
  darkText: string;
} {
  const statusLower = status.toLowerCase();

  if (statusLower.includes("done") || statusLower.includes("complete")) {
    return {
      bg: "bg-green-100",
      text: "text-green-800",
      darkBg: "dark:bg-green-900/30",
      darkText: "dark:text-green-400",
    };
  }

  if (statusLower.includes("progress") || statusLower.includes("review")) {
    return {
      bg: "bg-blue-100",
      text: "text-blue-800",
      darkBg: "dark:bg-blue-900/30",
      darkText: "dark:text-blue-400",
    };
  }

  // Default: To Do / Open
  return {
    bg: "bg-gray-100",
    text: "text-gray-800",
    darkBg: "dark:bg-gray-700",
    darkText: "dark:text-gray-300",
  };
}

export function getPriorityColor(priority: string): string {
  const priorityLower = priority.toLowerCase();

  switch (priorityLower) {
    case "highest":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-blue-500";
    case "lowest":
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
}
