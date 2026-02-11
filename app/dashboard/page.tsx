import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Webhook, FileText } from "lucide-react";

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your webhook endpoints and recent activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No API keys configured yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No endpoints created yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks Received</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No webhooks received yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Follow these steps to start catching webhooks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Badge variant="outline" className="mt-1">1</Badge>
            <div className="flex-1">
              <h3 className="font-medium">Configure a Mollie API Key</h3>
              <p className="text-sm text-muted-foreground">
                Add your Mollie API key to automatically fetch resource details for classic webhooks
              </p>
              <a
                href="/dashboard/api-keys"
                className="text-sm text-primary hover:underline mt-1 inline-block"
              >
                Go to API Keys →
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Badge variant="outline" className="mt-1">2</Badge>
            <div className="flex-1">
              <h3 className="font-medium">Create a Webhook Endpoint</h3>
              <p className="text-sm text-muted-foreground">
                Create a classic or next-gen webhook endpoint to start receiving webhooks
              </p>
              <a
                href="/dashboard/endpoints"
                className="text-sm text-primary hover:underline mt-1 inline-block"
              >
                Create Endpoint →
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Badge variant="outline" className="mt-1">3</Badge>
            <div className="flex-1">
              <h3 className="font-medium">Configure in Mollie</h3>
              <p className="text-sm text-muted-foreground">
                Copy your endpoint URL and configure it in your Mollie dashboard or API client
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Badge variant="outline" className="mt-1">4</Badge>
            <div className="flex-1">
              <h3 className="font-medium">View Webhook Logs</h3>
              <p className="text-sm text-muted-foreground">
                All received webhooks will appear in the logs for inspection and debugging
              </p>
              <a
                href="/dashboard/webhooks"
                className="text-sm text-primary hover:underline mt-1 inline-block"
              >
                View Logs →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
