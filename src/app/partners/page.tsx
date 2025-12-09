"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Copy,
  Pencil,
  Trash2,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  PLATFORMS,
  PARTNER_TYPES,
  PARTNER_STATUSES,
  getStatusColors,
  getPlatformColors,
  getPartnerTypeColors,
  getPlatformLabel,
  getPartnerTypeLabel,
  getStatusLabel,
} from "@/lib/partner-utils";
import { PartnerEditDialog } from "@/components/PartnerEditDialog";

interface Partner {
  id: string;
  name: string;
  uploadKey: string;
  dateAdded: string;
  platform: string | null;
  partnerType: string | null;
  config: string | null;
  partnerStatus: string;
  hasLandingPage: boolean;
  supportChannel: string | null;
  contactName: string | null;
  contactEmail: string | null;
  commission: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    tasks: number;
  };
}

export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Dialog states
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (platformFilter !== "all") params.set("platform", platformFilter);
      if (typeFilter !== "all") params.set("partnerType", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/partners?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (err) {
      console.error("Failed to fetch partners:", err);
      toast.error("Failed to load partners");
    } finally {
      setLoading(false);
    }
  }, [search, platformFilter, typeFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const debounce = setTimeout(fetchPartners, 300);
    return () => clearTimeout(debounce);
  }, [fetchPartners]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success("Upload key copied to clipboard");
    } catch {
      toast.error("Failed to copy key");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/partners/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete partner");
      }

      toast.success(`Partner "${deleteConfirm.name}" deleted`);
      setDeleteConfirm(null);
      fetchPartners();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete partner"
      );
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setPlatformFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const hasFilters =
    search ||
    platformFilter !== "all" ||
    typeFilter !== "all" ||
    statusFilter !== "all";

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partners</h1>
          <p className="text-muted-foreground">
            Manage B2B partners and their configurations
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {Object.entries(PLATFORMS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(PARTNER_TYPES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(PARTNER_STATUSES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Name
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Type</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("partnerStatus")}
              >
                <div className="flex items-center gap-2">
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Tasks</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {hasFilters
                    ? "No partners match your filters."
                    : "No partners yet. Add your first partner to get started."}
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => {
                const statusColors = getStatusColors(partner.partnerStatus);
                const platformColors = getPlatformColors(partner.platform);
                const typeColors = getPartnerTypeColors(partner.partnerType);

                return (
                  <TableRow
                    key={partner.id}
                    className="cursor-pointer"
                    onClick={() => setEditingPartner(partner)}
                  >
                    <TableCell className="font-medium">
                      {partner.name}
                    </TableCell>
                    <TableCell>
                      {partner.platform ? (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            platformColors.bg,
                            platformColors.text
                          )}
                        >
                          {getPlatformLabel(partner.platform)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {partner.partnerType ? (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            typeColors.bg,
                            typeColors.text
                          )}
                        >
                          {getPartnerTypeLabel(partner.partnerType)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          statusColors.bg,
                          statusColors.text
                        )}
                      >
                        {getStatusLabel(partner.partnerStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {partner.contactName ? (
                        <span className="truncate max-w-[150px] block">
                          {partner.contactName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          partner._count.tasks > 0
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {partner._count.tasks}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPartner(partner);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyKey(partner.uploadKey);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Upload Key
                          </DropdownMenuItem>
                          {partner._count.tasks > 0 && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                // Could link to tasks filtered by partner
                                router.push(`/?partner=${partner.id}`);
                              }}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Tasks ({partner._count.tasks})
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(partner);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Partner count */}
      {!loading && partners.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {partners.length} partner{partners.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Edit Dialog */}
      <PartnerEditDialog
        partner={editingPartner}
        open={!!editingPartner}
        onOpenChange={(open) => !open && setEditingPartner(null)}
        onSaved={() => {
          setEditingPartner(null);
          fetchPartners();
        }}
      />

      {/* Add Dialog - reuses edit dialog with no partner */}
      <PartnerEditDialog
        partner={null}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSaved={() => {
          setShowAddDialog(false);
          fetchPartners();
        }}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Partner?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
