"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  Power,
  PowerOff,
  Trash2,
  ExternalLink,
  Edit,
} from "lucide-react";
import { EditEndpointDialog } from "@/components/edit-endpoint-dialog";

type Endpoint = {
  _id: string;
  userId: string;
  name: string;
  type: "classic" | "nextgen";
  isEnabled: boolean;
  mollieApiKeyId?: {
    _id?: string;
    label: string;
    lastFourChars: string;
  };
  resourceTypeFilter?: string[];
  eventTypeFilter?: string[];
  forwardingEnabled?: boolean;
  forwardingUrl?: string;
  forwardingTimeout?: number;
  totalReceived: number;
  lastReceivedAt?: string;
  createdAt: string;
};

type ApiKey = {
  id: string;
  label: string;
  lastFourChars: string;
};

type Props = {
  endpoints: Endpoint[];
  apiKeys: ApiKey[];
  onEndpointChanged: () => void;
};

export function EndpointsList({ endpoints, apiKeys, onEndpointChanged }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);

  const getWebhookUrl = (endpoint: Endpoint) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/webhooks/${endpoint.type}/${endpoint.userId}/${endpoint._id}`;
  };

  const copyToClipboard = (endpoint: Endpoint) => {
    navigator.clipboard.writeText(getWebhookUrl(endpoint));
  };

  const toggleEndpoint = async (id: string) => {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/endpoints/${id}/toggle`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle endpoint");
      }

      onEndpointChanged();
    } catch (error) {
      console.error("Error toggling endpoint:", error);
      alert("Failed to toggle endpoint");
    } finally {
      setLoadingId(null);
    }
  };

  const deleteEndpoint = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete endpoint "${name}"?`)) {
      return;
    }

    setLoadingId(id);
    try {
      const response = await fetch(`/api/endpoints/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete endpoint");
      }

      onEndpointChanged();
    } catch (error) {
      console.error("Error deleting endpoint:", error);
      alert("Failed to delete endpoint");
    } finally {
      setLoadingId(null);
    }
  };

  if (endpoints.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">
          No webhook endpoints yet. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Webhooks</TableHead>
            <TableHead>Last Received</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {endpoints.map((endpoint) => (
            <TableRow key={endpoint._id}>
              <TableCell className="font-medium">{endpoint.name}</TableCell>
              <TableCell>
                <Badge variant={endpoint.type === "classic" ? "default" : "secondary"}>
                  {endpoint.type === "classic" ? "Classic" : "Next-Gen"}
                </Badge>
              </TableCell>
              <TableCell>
                {endpoint.isEnabled ? (
                  <Badge variant="default" className="bg-green-600">
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </TableCell>
              <TableCell>
                {endpoint.mollieApiKeyId ? (
                  <span className="text-sm">
                    {endpoint.mollieApiKeyId.label} (••••
                    {endpoint.mollieApiKeyId.lastFourChars})
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>{endpoint.totalReceived}</TableCell>
              <TableCell>
                {endpoint.lastReceivedAt
                  ? new Date(endpoint.lastReceivedAt).toLocaleString()
                  : "Never"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(endpoint)}
                    title="Copy webhook URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingEndpoint(endpoint)}
                    title="Edit endpoint"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEndpoint(endpoint._id)}
                    disabled={loadingId === endpoint._id}
                    title={
                      endpoint.isEnabled ? "Disable endpoint" : "Enable endpoint"
                    }
                  >
                    {endpoint.isEnabled ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEndpoint(endpoint._id, endpoint.name)}
                    disabled={loadingId === endpoint._id}
                    title="Delete endpoint"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditEndpointDialog
        endpoint={editingEndpoint ? {
          ...editingEndpoint,
          mollieApiKeyId: editingEndpoint.mollieApiKeyId?._id,
        } : null}
        apiKeys={apiKeys}
        open={!!editingEndpoint}
        onClose={() => setEditingEndpoint(null)}
        onEndpointUpdated={() => {
          setEditingEndpoint(null);
          onEndpointChanged();
        }}
      />
    </div>
  );
}
