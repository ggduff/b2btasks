"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PARTNER_STATUSES,
  STATUS_ORDER,
  getStatusColors,
  getPlatformColors,
  getPlatformLabel,
  getStatusLabel,
  type PartnerStatusKey,
} from "@/lib/partner-utils";

interface Partner {
  id: string;
  name: string;
  platform: string | null;
  partnerStatus: string;
}

interface PartnerSelectorProps {
  value: string | null | undefined; // undefined = not selected, null = "Other", string = partner ID
  onSelect: (partnerId: string | null) => void;
  onCreateNew: () => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function PartnerSelector({
  value,
  onSelect,
  onCreateNew,
  disabled,
  hasError,
}: PartnerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/partners?search=${encodeURIComponent(search)}`
        : "/api/partners";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (err) {
      console.error("Failed to fetch partners:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Fetch partners when dropdown opens or search changes
  useEffect(() => {
    if (open) {
      const debounce = setTimeout(fetchPartners, 300);
      return () => clearTimeout(debounce);
    }
  }, [open, search, fetchPartners]);

  // Find selected partner
  const selectedPartner = partners.find((p) => p.id === value);

  // Group partners by status
  const groupedPartners = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = partners.filter((p) => p.partnerStatus === status);
      return acc;
    },
    {} as Record<PartnerStatusKey, Partner[]>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            hasError && "border-destructive",
            value === undefined && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {value === undefined ? (
            "Select partner..."
          ) : value === null ? (
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Other (No specific partner)
            </span>
          ) : selectedPartner ? (
            <span className="flex items-center gap-2 truncate">
              {selectedPartner.name}
              {selectedPartner.platform && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs shrink-0",
                    getPlatformColors(selectedPartner.platform).bg,
                    getPlatformColors(selectedPartner.platform).text
                  )}
                >
                  {getPlatformLabel(selectedPartner.platform)}
                </Badge>
              )}
            </span>
          ) : (
            // Partner ID set but not found in loaded list (loading state)
            "Loading..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search partners..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No partners found."}
            </CommandEmpty>

            {/* Actions group */}
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onCreateNew();
                }}
                className="text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Partner
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0"
                  )}
                />
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                Other (No specific partner)
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {/* Partners grouped by status */}
            {STATUS_ORDER.map((status) => {
              const statusPartners = groupedPartners[status];
              if (!statusPartners || statusPartners.length === 0) return null;

              const statusColors = getStatusColors(status);

              return (
                <CommandGroup
                  key={status}
                  heading={
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-block w-2 h-2 rounded-full",
                          statusColors.bg
                        )}
                      />
                      {getStatusLabel(status)} ({statusPartners.length})
                    </span>
                  }
                >
                  {statusPartners.map((partner) => {
                    const platformColors = getPlatformColors(partner.platform);
                    return (
                      <CommandItem
                        key={partner.id}
                        value={partner.name}
                        onSelect={() => {
                          onSelect(partner.id === value ? null : partner.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === partner.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex items-center gap-2 flex-1 truncate">
                          <span className="truncate">{partner.name}</span>
                          {partner.platform && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs shrink-0",
                                platformColors.bg,
                                platformColors.text
                              )}
                            >
                              {getPlatformLabel(partner.platform)}
                            </Badge>
                          )}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
