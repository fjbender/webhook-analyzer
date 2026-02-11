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
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

type ApiKey = {
  id: string;
  label: string;
  lastFourChars: string;
};

type Props = {
  apiKeys: ApiKey[];
  onEndpointCreated: () => void;
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

export function CreateEndpointDialog({ apiKeys, onEndpointCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);

  // Classic endpoint state
  const [classicName, setClassicName] = useState("");
  const [selectedApiKey, setSelectedApiKey] = useState("");
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  // Next-gen endpoint state
  const [nextgenName, setNextgenName] = useState("");
  const [sharedSecret, setSharedSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Forwarding state (shared between classic and next-gen)
  const [forwardingEnabled, setForwardingEnabled] = useState(false);
  const [forwardingUrl, setForwardingUrl] = useState("");
  const [forwardingTimeout, setForwardingTimeout] = useState(30000);

  const resetForm = () => {
    setClassicName("");
    setSelectedApiKey("");
    setSelectedResources([]);
    setNextgenName("");
    setSharedSecret("");
    setSelectedEvents([]);
    setForwardingEnabled(false);
    setForwardingUrl("");
    setForwardingTimeout(30000);
    setError(null);
    setWebhookUrl(null);
  };

  const handleCreateClassic = async () => {
    if (!classicName.trim() || !selectedApiKey) {
      setError("Please fill in all required fields");
      return;
    }

    if (forwardingEnabled && !forwardingUrl.trim()) {
      setError("Please provide a forwarding URL or disable forwarding");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "classic",
          name: classicName.trim(),
          mollieApiKeyId: selectedApiKey,
          resourceTypeFilter:
            selectedResources.length > 0 ? selectedResources : undefined,
          forwardingEnabled,
          forwardingUrl: forwardingEnabled ? forwardingUrl.trim() : undefined,
          forwardingTimeout: forwardingEnabled ? forwardingTimeout : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create endpoint");
      }

      setWebhookUrl(data.webhookUrl);
      onEndpointCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNextgen = async () => {
    if (!nextgenName.trim() || !sharedSecret.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (forwardingEnabled && !forwardingUrl.trim()) {
      setError("Please provide a forwarding URL or disable forwarding");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "nextgen",
          name: nextgenName.trim(),
          sharedSecret: sharedSecret.trim(),
          eventTypeFilter:
            selectedEvents.length > 0 ? selectedEvents : undefined,
          forwardingEnabled,
          forwardingUrl: forwardingEnabled ? forwardingUrl.trim() : undefined,
          forwardingTimeout: forwardingEnabled ? forwardingTimeout : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create endpoint");
      }

      setWebhookUrl(data.webhookUrl);
      onEndpointCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetForm, 200);
  };

  const copyToClipboard = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
    }
  };

  if (webhookUrl) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Endpoint
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Endpoint Created!</DialogTitle>
            <DialogDescription>
              Your webhook endpoint has been created. Copy the URL below to
              configure it in the Mollie Dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <div className="flex gap-2 mt-2">
                <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                <Button onClick={copyToClipboard}>Copy</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Endpoint
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Webhook Endpoint</DialogTitle>
          <DialogDescription>
            Choose between Classic (resource reference) or Next-Gen (full
            payload with signature) webhook endpoints.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="classic">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classic">Classic</TabsTrigger>
            <TabsTrigger value="nextgen">Next-Gen</TabsTrigger>
          </TabsList>

          <TabsContent value="classic" className="space-y-4">
            <div>
              <Label htmlFor="classic-name">
                Endpoint Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="classic-name"
                placeholder="e.g., Payment Test Endpoint"
                value={classicName}
                onChange={(e) => setClassicName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="api-key">
                Mollie API Key <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                <SelectTrigger id="api-key">
                  <SelectValue placeholder="Select an API key" />
                </SelectTrigger>
                <SelectContent>
                  {apiKeys.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No API keys available. Please add one first.
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
              <p className="text-sm text-muted-foreground mt-1">
                Used to fetch resource details from Mollie API
              </p>
            </div>

            <div>
              <Label>Resource Type Filter (Optional)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {resourceTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`resource-${type.value}`}
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
                      htmlFor={`resource-${type.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Leave empty to accept all resource types
              </p>
            </div>

            {/* Forwarding Configuration */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="forwarding-enabled-classic"
                  checked={forwardingEnabled}
                  onCheckedChange={(checked) => setForwardingEnabled(!!checked)}
                />
                <Label htmlFor="forwarding-enabled-classic" className="cursor-pointer">
                  Enable Webhook Forwarding
                </Label>
              </div>

              {forwardingEnabled && (
                <div className="space-y-4 pl-6">
                  <div>
                    <Label htmlFor="forwarding-url-classic">
                      Forwarding URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="forwarding-url-classic"
                      type="url"
                      placeholder="https://your-app.com/webhooks/mollie"
                      value={forwardingUrl}
                      onChange={(e) => setForwardingUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Webhook will be forwarded to this URL after processing
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="forwarding-timeout-classic">
                      Timeout (seconds)
                    </Label>
                    <Select
                      value={forwardingTimeout.toString()}
                      onValueChange={(val) => setForwardingTimeout(parseInt(val))}
                    >
                      <SelectTrigger id="forwarding-timeout-classic">
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

            <DialogFooter>
              <Button onClick={handleCreateClassic} disabled={loading}>
                {loading ? "Creating..." : "Create Classic Endpoint"}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="nextgen" className="space-y-4">
            <div>
              <Label htmlFor="nextgen-name">
                Endpoint Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nextgen-name"
                placeholder="e.g., Subscription Webhooks"
                value={nextgenName}
                onChange={(e) => setNextgenName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="shared-secret">
                Shared Secret <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shared-secret"
                type="password"
                placeholder="From Mollie Dashboard"
                value={sharedSecret}
                onChange={(e) => setSharedSecret(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Used to verify webhook signature
              </p>
            </div>

            <div>
              <Label>Event Type Filter (Optional)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-64 overflow-y-auto">
                {eventTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`event-${type.value}`}
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
                      htmlFor={`event-${type.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Leave empty to accept all event types
              </p>
            </div>

            {/* Forwarding Configuration */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="forwarding-enabled-nextgen"
                  checked={forwardingEnabled}
                  onCheckedChange={(checked) => setForwardingEnabled(!!checked)}
                />
                <Label htmlFor="forwarding-enabled-nextgen" className="cursor-pointer">
                  Enable Webhook Forwarding
                </Label>
              </div>

              {forwardingEnabled && (
                <div className="space-y-4 pl-6">
                  <div>
                    <Label htmlFor="forwarding-url-nextgen">
                      Forwarding URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="forwarding-url-nextgen"
                      type="url"
                      placeholder="https://your-app.com/webhooks/mollie"
                      value={forwardingUrl}
                      onChange={(e) => setForwardingUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Webhook will be forwarded to this URL after processing
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="forwarding-timeout-nextgen">
                      Timeout (seconds)
                    </Label>
                    <Select
                      value={forwardingTimeout.toString()}
                      onValueChange={(val) => setForwardingTimeout(parseInt(val))}
                    >
                      <SelectTrigger id="forwarding-timeout-nextgen">
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

            <DialogFooter>
              <Button onClick={handleCreateNextgen} disabled={loading}>
                {loading ? "Creating..." : "Create Next-Gen Endpoint"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
