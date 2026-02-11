"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

type Endpoint = {
  _id: string;
  name: string;
  type: "classic" | "nextgen";
  isEnabled: boolean;
  mollieApiKeyId?: string;
  resourceTypeFilter?: string[];
  sharedSecret?: string;
  eventTypeFilter?: string[];
  forwardingEnabled?: boolean;
  forwardingUrl?: string;
  forwardingTimeout?: number;
};

type ApiKey = {
  id: string;
  label: string;
  lastFourChars: string;
};

type Props = {
  endpoint: Endpoint | null;
  apiKeys: ApiKey[];
  open: boolean;
  onClose: () => void;
  onEndpointUpdated: () => void;
};

const resourceTypes = [
  { value: "payment", label: "Payment" },
  { value: "order", label: "Order" },
  { value: "refund", label: "Refund" },
  { value: "subscription", label: "Subscription" },
  { value: "mandate", label: "Mandate" },
  { value: "customer", label: "Customer" },
  { value: "invoice", label: "Invoice" },
];

const eventTypes = [
  { value: "payment.created", label: "Payment Created" },
  { value: "payment.paid", label: "Payment Paid" },
  { value: "payment.failed", label: "Payment Failed" },
  { value: "payment.expired", label: "Payment Expired" },
  { value: "payment.canceled", label: "Payment Canceled" },
  { value: "order.created", label: "Order Created" },
  { value: "order.paid", label: "Order Paid" },
  { value: "order.completed", label: "Order Completed" },
  { value: "order.expired", label: "Order Expired" },
  { value: "order.canceled", label: "Order Canceled" },
  { value: "refund.created", label: "Refund Created" },
  { value: "refund.failed", label: "Refund Failed" },
  { value: "subscription.created", label: "Subscription Created" },
  { value: "subscription.activated", label: "Subscription Activated" },
  { value: "subscription.canceled", label: "Subscription Canceled" },
  { value: "subscription.suspended", label: "Subscription Suspended" },
  { value: "subscription.resumed", label: "Subscription Resumed" },
];

export function EditEndpointDialog({
  endpoint,
  apiKeys,
  open,
  onClose,
  onEndpointUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [selectedApiKey, setSelectedApiKey] = useState("");
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [forwardingEnabled, setForwardingEnabled] = useState(false);
  const [forwardingUrl, setForwardingUrl] = useState("");
  const [forwardingTimeout, setForwardingTimeout] = useState(30000);

  // Load endpoint data when dialog opens
  useEffect(() => {
    if (endpoint && open) {
      setName(endpoint.name);
      setSelectedApiKey(endpoint.mollieApiKeyId || "");
      setSelectedResources(endpoint.resourceTypeFilter || []);
      setSelectedEvents(endpoint.eventTypeFilter || []);
      setForwardingEnabled(endpoint.forwardingEnabled || false);
      setForwardingUrl(endpoint.forwardingUrl || "");
      setForwardingTimeout(endpoint.forwardingTimeout || 30000);
      setError(null);
    }
  }, [endpoint, open]);

  const handleUpdate = async () => {
    if (!endpoint) return;
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (forwardingEnabled && !forwardingUrl.trim()) {
      setError("Please provide a forwarding URL or disable forwarding");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        name: name.trim(),
      };

      // Only include fields that changed
      if (endpoint.type === "classic") {
        updateData.mollieApiKeyId = selectedApiKey;
        updateData.resourceTypeFilter =
          selectedResources.length > 0 ? selectedResources : undefined;
      } else {
        updateData.eventTypeFilter =
          selectedEvents.length > 0 ? selectedEvents : undefined;
      }

      // Forwarding config
      updateData.forwardingEnabled = forwardingEnabled;
      if (forwardingEnabled) {
        updateData.forwardingUrl = forwardingUrl.trim();
        updateData.forwardingTimeout = forwardingTimeout;
      }

      const response = await fetch(`/api/endpoints/${endpoint._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update endpoint");
      }

      onEndpointUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!endpoint) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Endpoint</DialogTitle>
          <DialogDescription>
            Update your {endpoint.type === "classic" ? "Classic" : "Next-Gen"} webhook
            endpoint configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">
              Endpoint Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {endpoint.type === "classic" ? (
            <>
              <div>
                <Label htmlFor="edit-api-key">Mollie API Key</Label>
                <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                  <SelectTrigger id="edit-api-key">
                    <SelectValue placeholder="Select an API key" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiKeys.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No API keys available
                      </div>
                    ) : (
                      apiKeys.map((key) => (
                        <SelectItem key={key.id} value={key.id}>
                          {key.label} (••••{key.lastFourChars})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Resource Type Filter (Optional)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {resourceTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-resource-${type.value}`}
                        checked={selectedResources.includes(type.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedResources([...selectedResources, type.value]);
                          } else {
                            setSelectedResources(
                              selectedResources.filter((r) => r !== type.value)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`edit-resource-${type.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <Label>Event Type Filter (Optional)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-64 overflow-y-auto">
                {eventTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-event-${type.value}`}
                      checked={selectedEvents.includes(type.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEvents([...selectedEvents, type.value]);
                        } else {
                          setSelectedEvents(
                            selectedEvents.filter((e) => e !== type.value)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`edit-event-${type.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forwarding Configuration */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="edit-forwarding-enabled"
                checked={forwardingEnabled}
                onCheckedChange={(checked) => setForwardingEnabled(!!checked)}
              />
              <Label htmlFor="edit-forwarding-enabled" className="cursor-pointer">
                Enable Webhook Forwarding
              </Label>
            </div>

            {forwardingEnabled && (
              <div className="space-y-4 pl-6">
                <div>
                  <Label htmlFor="edit-forwarding-url">
                    Forwarding URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-forwarding-url"
                    type="url"
                    placeholder="https://your-app.com/webhooks/mollie"
                    value={forwardingUrl}
                    onChange={(e) => setForwardingUrl(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-forwarding-timeout">Timeout (seconds)</Label>
                  <Select
                    value={forwardingTimeout.toString()}
                    onValueChange={(val) => setForwardingTimeout(parseInt(val))}
                  >
                    <SelectTrigger id="edit-forwarding-timeout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10000">10 seconds</SelectItem>
                      <SelectItem value="30000">30 seconds (default)</SelectItem>
                      <SelectItem value="60000">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Endpoint"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
