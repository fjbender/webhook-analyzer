"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Filter, Search, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { WebhookDetailModal } from "@/components/webhook-detail-modal";

type WebhookLog = {
  _id: string;
  endpointId: {
    _id: string;
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
  status: string;
};

type Endpoint = {
  _id: string;
  name: string;
  type: string;
};

export default function WebhooksPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [endpointFilter, setEndpointFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (search) params.append("search", search);
      if (endpointFilter !== "all") params.append("endpointId", endpointFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/webhook-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEndpoints = async () => {
    try {
      const response = await fetch("/api/endpoints");
      if (response.ok) {
        const data = await response.json();
        setEndpoints(data.endpoints);
      }
    } catch (error) {
      console.error("Error fetching endpoints:", error);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, search, endpointFilter, statusFilter]);

  const handleView = (log: WebhookLog) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook log?")) {
      return;
    }

    try {
      const response = await fetch(`/api/webhook-logs/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchLogs();
      }
    } catch (error) {
      console.error("Error deleting log:", error);
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Webhook Logs</h1>
            <p className="text-muted-foreground">
              View and inspect all received webhook payloads
            </p>
          </div>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (logs.length === 0 && !search && endpointFilter === "all" && statusFilter === "all") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Webhook Logs</h1>
            <p className="text-muted-foreground">
              View and inspect all received webhook payloads
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              No Webhooks Yet
            </CardTitle>
            <CardDescription>
              Webhooks received at your endpoints will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Waiting for webhooks</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Once you've created an endpoint and configured it in Mollie, all received webhooks
                will be captured and displayed here for inspection.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href="/dashboard/endpoints">Create Endpoint</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/dashboard/api-keys">Configure API Keys</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What You'll See Here</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <strong>Request Details:</strong> Timestamp, endpoint, HTTP headers, IP address
            </p>
            <p>
              • <strong>Original Payload:</strong> The raw webhook payload as received from Mollie
            </p>
            <p>
              • <strong>Fetched Resources:</strong> Full resource details (for classic webhooks)
            </p>
            <p>
              • <strong>Signature Status:</strong> Verification result (for next-gen webhooks)
            </p>
            <p>
              • <strong>Search & Filter:</strong> Find webhooks by date, endpoint, resource type, or status
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Logs</h1>
          <p className="text-muted-foreground">
            {total} webhook{total !== 1 ? "s" : ""} received
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by resource ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={endpointFilter}
          onValueChange={(value) => {
            setEndpointFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Endpoints" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Endpoints</SelectItem>
            {endpoints.map((endpoint) => (
              <SelectItem key={endpoint._id} value={endpoint._id}>
                {endpoint.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="fetch_failed">Fetch Failed</SelectItem>
            <SelectItem value="signature_failed">Signature Failed</SelectItem>
            <SelectItem value="invalid">Invalid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Webhook Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Resource/Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Forwarding</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="text-sm">
                    {new Date(log.receivedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{log.endpointId.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {log.endpointId.type === "classic" ? "Classic" : "Next-Gen"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {log.resourceType && log.resourceId ? (
                      <div>
                        <div className="text-xs text-muted-foreground">{log.resourceType}</div>
                        <div>{log.resourceId}</div>
                      </div>
                    ) : log.eventType ? (
                      log.eventType
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    {log.forwardedAt ? (
                      log.forwardingStatus && log.forwardingStatus >= 200 && log.forwardingStatus < 300 ? (
                        <Badge className="bg-green-600 text-xs">
                          Forwarded
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Failed
                        </Badge>
                      )
                    ) : log.endpointId.forwardingEnabled ? (
                      <Badge variant="outline" className="text-xs">
                        Pending
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                    {log.isReplay && (
                      <Badge variant="outline" className="text-xs ml-1">
                        Replay
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{log.processingTimeMs}ms</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(log._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <WebhookDetailModal
        log={selectedLog}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}
