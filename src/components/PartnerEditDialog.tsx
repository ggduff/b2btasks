"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  PLATFORMS,
  PARTNER_TYPES,
  CONFIG_TYPES,
  PARTNER_STATUSES,
} from "@/lib/partner-utils";

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
}

interface PartnerEditDialogProps {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function PartnerEditDialog({
  partner,
  open,
  onOpenChange,
  onSaved,
}: PartnerEditDialogProps) {
  const isEditing = !!partner;
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [partnerType, setPartnerType] = useState<string>("");
  const [config, setConfig] = useState<string>("");
  const [partnerStatus, setPartnerStatus] = useState<string>("PRE_SALES");
  const [hasLandingPage, setHasLandingPage] = useState(false);
  const [supportChannel, setSupportChannel] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [commission, setCommission] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Reset form when partner changes
  useEffect(() => {
    if (partner) {
      setName(partner.name);
      setPlatform(partner.platform || "");
      setPartnerType(partner.partnerType || "");
      setConfig(partner.config || "");
      setPartnerStatus(partner.partnerStatus);
      setHasLandingPage(partner.hasLandingPage);
      setSupportChannel(partner.supportChannel || "");
      setContactName(partner.contactName || "");
      setContactEmail(partner.contactEmail || "");
      setCommission(partner.commission?.toString() || "");
      setNotes(partner.notes || "");
    } else {
      // Reset for new partner
      setName("");
      setPlatform("");
      setPartnerType("");
      setConfig("");
      setPartnerStatus("PRE_SALES");
      setHasLandingPage(false);
      setSupportChannel("");
      setContactName("");
      setContactEmail("");
      setCommission("");
      setNotes("");
    }
  }, [partner, open]);

  const handleCopyKey = async () => {
    if (!partner?.uploadKey) return;
    try {
      await navigator.clipboard.writeText(partner.uploadKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Upload key copied to clipboard");
    } catch {
      toast.error("Failed to copy key");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Partner name is required");
      return;
    }

    setIsLoading(true);
    try {
      const body = {
        name: name.trim(),
        platform: platform || null,
        partnerType: partnerType || null,
        config: config || null,
        partnerStatus,
        hasLandingPage,
        supportChannel: supportChannel.trim() || null,
        contactName: contactName.trim() || null,
        contactEmail: contactEmail.trim() || null,
        commission:
          partnerType === "AFFILIATE" && commission
            ? parseInt(commission)
            : null,
        notes: notes.trim() || null,
      };

      const url = isEditing ? `/api/partners/${partner.id}` : "/api/partners";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditing ? "update" : "create"} partner`);
      }

      const savedPartner = await response.json();

      if (isEditing) {
        toast.success(`Partner "${savedPartner.name}" updated`);
      } else {
        toast.success(
          <div className="flex flex-col gap-1">
            <span>Partner &quot;{savedPartner.name}&quot; created</span>
            <span className="text-xs text-muted-foreground font-mono">
              Key: {savedPartner.uploadKey}
            </span>
          </div>,
          {
            duration: 5000,
            action: {
              label: "Copy Key",
              onClick: () => {
                navigator.clipboard.writeText(savedPartner.uploadKey);
                toast.success("Upload key copied");
              },
            },
          }
        );
      }

      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditing ? "update" : "create"} partner`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Partner" : "Add New Partner"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update partner details and configuration."
                : "Create a new partner. An upload key will be generated automatically."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Upload Key (edit mode only) */}
            {isEditing && partner?.uploadKey && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Upload Key</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm truncate">
                    {partner.uploadKey}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyKey}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Identity Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Identity
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Partner Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter partner name"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Partner Status</Label>
                  <Select
                    value={partnerStatus}
                    onValueChange={setPartnerStatus}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
              </div>
            </div>

            {/* Classification Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Classification
              </h4>
              <div className="grid grid-cols-3 gap-4">
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
                      <SelectItem value="">None</SelectItem>
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
                      <SelectItem value="">None</SelectItem>
                      {Object.entries(PARTNER_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Config</Label>
                  <Select
                    value={config}
                    onValueChange={setConfig}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {Object.entries(CONFIG_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Features
              </h4>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="landing-page">Has Landing Page</Label>
                  <p className="text-xs text-muted-foreground">
                    Partner has a custom landing page configured
                  </p>
                </div>
                <Switch
                  id="landing-page"
                  checked={hasLandingPage}
                  onCheckedChange={setHasLandingPage}
                  disabled={isLoading}
                />
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
                    className="w-32"
                  />
                </div>
              )}
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contact-name">Contact Name</Label>
                  <Input
                    id="contact-name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Smith"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="john@example.com"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-channel">Support Channel</Label>
                <Input
                  id="support-channel"
                  value={supportChannel}
                  onChange={(e) => setSupportChannel(e.target.value)}
                  placeholder="e.g., Slack Channel, Skype: handle, Teams"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Notes
              </h4>
              <div className="grid gap-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this partner..."
                  disabled={isLoading}
                  rows={3}
                />
              </div>
            </div>

            {/* Metadata (edit mode only) */}
            {isEditing && partner && (
              <div className="text-xs text-muted-foreground">
                Added: {new Date(partner.dateAdded).toLocaleDateString()}
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
              {isLoading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Partner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
