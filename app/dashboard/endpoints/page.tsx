"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, AlertCircle } from "lucide-react";
import { CreateEndpointDialog } from "@/components/create-endpoint-dialog";
import { EndpointsList } from "@/components/endpoints-list";

type Endpoint = {
  _id: string;
  userId: string;
  name: string;
  type: "classic" | "nextgen";
  isEnabled: boolean;
  mollieApiKeyId?: {
    label: string;
    lastFourChars: string;
  };
  totalReceived: number;
  lastReceivedAt?: string;
  createdAt: string;
};

type ApiKey = {
  id: string;
  label: string;
  lastFourChars: string;
};

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [endpointsRes, apiKeysRes] = await Promise.all([
        fetch("/api/endpoints"),
        fetch("/api/mollie-keys"),
      ]);

      if (endpointsRes.ok) {
        const data = await endpointsRes.json();
        setEndpoints(data.endpoints || []);
      }

      if (apiKeysRes.ok) {
        const data = await apiKeysRes.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Webhook Endpoints</h1>
            <p className="text-muted-foreground">
              Create and manage endpoints for receiving Mollie webhooks
            </p>
          </div>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Endpoints</h1>
          <p className="text-muted-foreground">
            Create and manage endpoints for receiving Mollie webhooks
          </p>
        </div>
        <CreateEndpointDialog apiKeys={apiKeys} onEndpointCreated={fetchData} />
      </div>

      {endpoints.length === 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                No Endpoints Yet
              </CardTitle>
              <CardDescription>
                Create webhook endpoints to start receiving and analyzing Mollie webhooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Create your first endpoint</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Choose between classic webhooks (reference-based) or next-gen webhooks (payload-based)
                  to start capturing webhook data.
                </p>
                <CreateEndpointDialog apiKeys={apiKeys} onEndpointCreated={fetchData} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Classic Webhooks</CardTitle>
                  <Badge variant="outline">Reference-based</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Mollie sends only a resource ID. We automatically fetch the full resource using your API key.
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ Automatic resource fetching</li>
                  <li>✓ Supports all resource types</li>
                  <li>✓ Requires Mollie API key</li>
                  <li>✓ Simple setup</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Next-Gen Webhooks</CardTitle>
                  <Badge variant="outline">Payload-based</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Mollie sends the full payload with signature verification for enhanced security.
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ Full payload included</li>
                  <li>✓ HMAC signature verification</li>
                  <li>✓ No API key needed</li>
                  <li>✓ Enhanced security</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <CardTitle className="text-base">Before You Start</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                For <strong>classic webhooks</strong>, make sure you've added at least one Mollie API key
                in the API Keys section.
              </p>
              <p>
                For <strong>next-gen webhooks</strong>, you'll need the shared secret provided by Mollie
                when configuring the webhook.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <EndpointsList 
            endpoints={endpoints} 
            apiKeys={apiKeys}
            onEndpointChanged={fetchData} 
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Classic Webhooks</CardTitle>
                  <Badge variant="outline">Reference-based</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Mollie sends only a resource ID. We automatically fetch the full resource using your API key.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Next-Gen Webhooks</CardTitle>
                  <Badge variant="outline">Payload-based</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Mollie sends the full payload with signature verification for enhanced security.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
