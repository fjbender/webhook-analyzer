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
import { Badge } from "@/components/ui/badge";

interface AddApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddApiKeyDialog({ open, onOpenChange, onSuccess }: AddApiKeyDialogProps) {
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/mollie-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, apiKey, isDefault }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add API key");
        setIsLoading(false);
        return;
      }

      // Reset form
      setLabel("");
      setApiKey("");
      setIsDefault(false);
      onSuccess();
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setLabel("");
      setApiKey("");
      setIsDefault(false);
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Mollie API Key</DialogTitle>
          <DialogDescription>
            Add a Mollie test or live API key to fetch full resource details for classic webhooks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="e.g., Production, Test, Client A"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this API key
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">Mollie API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="test_... or live_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Starts with <Badge variant="outline" className="text-xs px-1 py-0">test_</Badge> or{" "}
                <Badge variant="outline" className="text-xs px-1 py-0">live_</Badge>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">
                Set as default API key
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add API Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
