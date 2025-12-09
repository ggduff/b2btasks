"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  PLATFORMS,
  PARTNER_TYPES,
  PARTNER_STATUSES,
} from "@/lib/partner-utils";

interface QuickPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartnerCreated: (partnerId: string, partnerName: string) => void;
}

export function QuickPartnerDialog({
  open,
  onOpenChange,
  onPartnerCreated,
}: QuickPartnerDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [partnerType, setPartnerType] = useState<string>("");
  const [partnerStatus, setPartnerStatus] = useState<string>("PRE_SALES");
  const [commission, setCommission] = useState<string>("");

  const resetForm = () => {
    setName("");
    setPlatform("");
    setPartnerType("");
    setPartnerStatus("PRE_SALES");
    setCommission("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Partner name is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          platform: platform || null,
          partnerType: partnerType || null,
          partnerStatus: partnerStatus || "PRE_SALES",
          commission:
            partnerType === "AFFILIATE" && commission
              ? parseInt(commission)
              : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create partner");
      }

      const partner = await response.json();
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Partner &quot;{partner.name}&quot; created</span>
          <span className="text-xs text-muted-foreground font-mono">
            Key: {partner.uploadKey}
          </span>
        </div>,
        {
          duration: 5000,
          action: {
            label: "Copy Key",
            onClick: () => {
              navigator.clipboard.writeText(partner.uploadKey);
              toast.success("Upload key copied to clipboard");
            },
          },
        }
      );

      onPartnerCreated(partner.id, partner.name);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create partner"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Quick Add Partner</DialogTitle>
            <DialogDescription>
              Create a new partner. You can add more details later in Partner
              Management.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Partner Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter partner name"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Platform</Label>
                <Select
                  value={platform}
                  onValueChange={setPlatform}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORMS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Partner Type</Label>
                <Select
                  value={partnerType}
                  onValueChange={setPartnerType}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PARTNER_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Partner Status</Label>
              <Select
                value={partnerStatus}
                onValueChange={setPartnerStatus}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTNER_STATUSES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {partnerType === "AFFILIATE" && (
              <div className="grid gap-2">
                <Label htmlFor="commission">Commission (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="e.g., 20"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Partner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
