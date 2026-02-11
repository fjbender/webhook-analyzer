"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Download, Check, RefreshCw } from "lucide-react";

type WebhookLog = {
  _id: string;
  endpointId: {
    name: string;
    type: string;
    forwardingEnabled?: boolean;
    forwardingUrl?: string;
  };
  receivedAt: string;
  processingTimeMs: number;
  requestHeaders: Record<string, string>;
  requestBody: any;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  fetchedResource?: any;
  fetchError?: string;
  eventType?: string;
  signatureValid?: boolean;
  signatureHeader?: string;
  forwardedAt?: string;
  forwardingUrl?: string;
  forwardingStatus?: number;
  forwardingError?: string;
  forwardingTimeMs?: number;
  isReplay?: boolean;
  originalLogId?: string;
  replayedAt?: string;
  status: string;
};

type Props = {
  log: WebhookLog | null;
  open: boolean;
  onClose: () => void;
};

export function WebhookDetailModal({ log, open, onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayError, setReplayError] = useState<string | null>(null);
  const [replaySuccess, setReplaySuccess] = useState(false);

  if (!log) return null;

  const handleReplay = async (target: "endpoint" | "forward") => {
    setIsReplaying(true);
    setReplayError(null);
    setReplaySuccess(false);

    try {
      const response = await fetch(`/api/webhook-logs/${log._id}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to replay webhook");
      }

      setReplaySuccess(true);
      setTimeout(() => {
        setReplaySuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      setReplayError(error.message);
    } finally {
      setIsReplaying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-600">Success</Badge>;
      case "fetch_failed":
        return <Badge variant="destructive">Fetch Failed</Badge>;
      case "signature_failed":
        return <Badge variant="destructive">Signature Failed</Badge>;
      case "invalid":
        return <Badge variant="secondary">Invalid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Webhook Details</DialogTitle>
              <DialogDescription>
                {log.endpointId.name} • {new Date(log.receivedAt).toLocaleString()}
                {log.isReplay && (
                  <Badge variant="outline" className="ml-2">
                    Replayed
                  </Badge>
                )}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReplay("endpoint")}
                disabled={isReplaying}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isReplaying ? "animate-spin" : ""}`} />
                Replay to Endpoint
              </Button>
              {log.endpointId.forwardingEnabled && log.endpointId.forwardingUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReplay("forward")}
                  disabled={isReplaying}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isReplaying ? "animate-spin" : ""}`} />
                  Replay to Forward URL
                </Button>
              )}
            </div>
          </div>
          {replayError && (
            <div className="text-sm text-red-500 mt-2">{replayError}</div>
          )}
          {replaySuccess && (
            <div className="text-sm text-green-600 mt-2">Webhook replayed successfully!</div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <div className="mt-1">{getStatusBadge(log.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Processing Time</label>
              <div className="mt-1 text-sm">{log.processingTimeMs}ms</div>
            </div>
            <div>
              <label className="text-sm font-medium">IP Address</label>
              <div className="mt-1 text-sm font-mono">{log.ipAddress || "N/A"}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Endpoint Type</label>
              <div className="mt-1">
                <Badge variant="outline">
                  {log.endpointId.type === "classic" ? "Classic" : "Next-Gen"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Classic Webhook Data */}
          {log.resourceType && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Resource Information</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Type</label>
                    <div className="text-sm font-mono">{log.resourceType}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">ID</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{log.resourceId}</span>
                      {log.resourceId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(log.resourceId!, "resourceId")
                          }
                        >
                          {copied === "resourceId" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {log.fetchError && (
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded">
                  <label className="text-sm font-medium text-red-900 dark:text-red-100">
                    Fetch Error
                  </label>
                  <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {log.fetchError}
                  </div>
                </div>
              )}

              <Separator />
            </>
          )}

          {/* Next-Gen Webhook Data */}
          {log.eventType && (
            <>
              <div>
                <label className="text-sm font-medium">Event Type</label>
                <div className="mt-1">
                  <Badge>{log.eventType}</Badge>
                </div>
              </div>

              {log.signatureValid !== undefined && (
                <div>
                  <label className="text-sm font-medium">Signature Verification</label>
                  <div className="mt-1">
                    {log.signatureValid ? (
                      <Badge className="bg-green-600">Valid</Badge>
                    ) : (
                      <Badge variant="destructive">Invalid</Badge>
                    )}
                  </div>
                </div>
              )}

              <Separator />
            </>
          )}

          {/* Request Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Request Payload</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(log.requestBody, null, 2),
                      "requestBody"
                    )
                  }
                >
                  {copied === "requestBody" ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadJSON(log.requestBody, `webhook-${log._id}-request.json`)
                  }
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <pre className="bg-muted p-4 rounded text-xs overflow-x-auto max-h-64">
              {JSON.stringify(log.requestBody, null, 2)}
            </pre>
          </div>

          {/* Fetched Resource (Classic only) */}
          {log.fetchedResource && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Fetched Resource from Mollie</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(log.fetchedResource, null, 2),
                          "fetchedResource"
                        )
                      }
                    >
                      {copied === "fetchedResource" ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadJSON(
                          log.fetchedResource,
                          `webhook-${log._id}-resource.json`
                        )
                      }
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto max-h-96">
                  {JSON.stringify(log.fetchedResource, null, 2)}
                </pre>
              </div>
            </>
          )}

          {/* Forwarding Details */}
          {(log.forwardedAt || log.forwardingError) && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium mb-2 block">Forwarding Details</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <div className="mt-1">
                      {log.forwardingStatus && log.forwardingStatus >= 200 && log.forwardingStatus < 300 ? (
                        <Badge className="bg-green-600">Success ({log.forwardingStatus})</Badge>
                      ) : (
                        <Badge variant="destructive">
                          Failed {log.forwardingStatus ? `(${log.forwardingStatus})` : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Response Time</label>
                    <div className="text-sm mt-1">{log.forwardingTimeMs}ms</div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-muted-foreground">Forwarding URL</label>
                    <div className="text-sm font-mono mt-1 break-all">{log.forwardingUrl}</div>
                  </div>
                  {log.forwardingError && (
                    <div className="col-span-2">
                      <label className="text-sm text-muted-foreground">Error</label>
                      <div className="text-sm text-red-500 mt-1">{log.forwardingError}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Request Headers */}
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Request Headers</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(log.requestHeaders, null, 2),
                    "headers"
                  )
                }
              >
                {copied === "headers" ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded text-xs overflow-x-auto max-h-48">
              {JSON.stringify(log.requestHeaders, null, 2)}
            </pre>
          </div>

          {/* User Agent */}
          {log.userAgent && (
            <div>
              <label className="text-sm font-medium">User Agent</label>
              <div className="mt-1 text-xs font-mono text-muted-foreground">
                {log.userAgent}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
