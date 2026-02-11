"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddApiKeyDialog } from "@/components/add-api-key-dialog";
import { ApiKeysList } from "@/components/api-keys-list";

export default function ApiKeysPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/mollie-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleApiKeyAdded = () => {
    setIsAddDialogOpen(false);
    fetchApiKeys();
  };

  const handleApiKeyDeleted = () => {
    fetchApiKeys();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your Mollie API keys for fetching webhook resources
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add API Key
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No API Keys Yet</CardTitle>
            <CardDescription>
              Add your Mollie API keys to automatically fetch full resource details when classic
              webhooks are received.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <h3 className="font-medium mb-2">Get started with API keys</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Add your Mollie test or live API key. When a classic webhook is received, we'll
                automatically fetch the full resource details from Mollie's API.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ApiKeysList apiKeys={apiKeys} onApiKeyDeleted={handleApiKeyDeleted} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Classic Webhooks:</strong> Mollie sends only a resource ID. We use your API
            key to fetch the full resource details.
          </p>
          <p>
            • <strong>Next-Gen Webhooks:</strong> Full payload is included, so no API key is
            needed.
          </p>
          <p>
            • <strong>Security:</strong> All API keys are encrypted using AES-256-GCM before
            storage.
          </p>
          <p>
            • <strong>Test Mode:</strong> Use test mode API keys (test_...) for development.
          </p>
        </CardContent>
      </Card>

      <AddApiKeyDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleApiKeyAdded}
      />
    </div>
  );
}
