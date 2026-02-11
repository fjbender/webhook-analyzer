"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Trash2, RefreshCw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApiKey {
  id: string;
  label: string;
  lastFourChars: string;
  isDefault: boolean;
  isValid: boolean;
  lastValidatedAt?: string;
  createdAt: string;
}

interface ApiKeysListProps {
  apiKeys: ApiKey[];
  onApiKeyDeleted: () => void;
}

export function ApiKeysList({ apiKeys, onApiKeyDeleted }: ApiKeysListProps) {
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleValidate = async (id: string) => {
    setValidatingId(id);
    try {
      const response = await fetch(`/api/mollie-keys/${id}/validate`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh the list
        onApiKeyDeleted();
      }
    } catch (error) {
      console.error("Failed to validate API key:", error);
    } finally {
      setValidatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/mollie-keys/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteId(null);
        onApiKeyDeleted();
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {apiKey.label}
                      {apiKey.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    ••••{apiKey.lastFourChars}
                  </TableCell>
                  <TableCell>
                    {apiKey.isValid ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(apiKey.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidate(apiKey.id)}
                        disabled={validatingId === apiKey.id}
                      >
                        {validatingId === apiKey.id ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Test
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(apiKey.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={() => !isDeleting && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
