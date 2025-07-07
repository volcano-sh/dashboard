"use client"

import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import * as React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { trpc } from "@volcano/trpc/react"

const defaultQueueYaml = `apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: test
spec:
  capability:
    cpu: "8"
    memory: 16Gi
  # deserved field is only used by capacity plugin
  deserved:
    cpu: "4"
    memory: 8Gi
  guarantee:
    resource:
      cpu: "2"
      memory: 4Gi
  priority: 100
  reclaimable: true
  # weight field is only used by proportion plugin
  weight: 1
status:
  allocated:
    cpu: "0"
    memory: "0"
  state: Open`

export function CreateQueueDialog({ open, setOpen, handleRefresh }: { open: boolean, setOpen: (open: boolean) => void, handleRefresh: () => void }) {
  const [yaml, setYaml] = React.useState(defaultQueueYaml)
  const [status, setStatus] = React.useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })
  
  React.useEffect(() => {
    if (open) {
      setStatus({ type: null, message: "" })
    }
  }, [open])

  const { mutateAsync: createQueue, isPending: isCreating } = trpc.queueRouter.createQueue.useMutation(
    {
      onSuccess: () => {
        setStatus({
          type: "success",
          message: "Queue created successfully!",
        })

        setOpen(false)
        handleRefresh()
      },
      onError: (error) => {
        setStatus({
          type: "error",
          message: error.message,
        })
      },
    }
  )

  const parseYamlToManifest = (yamlString: string) => {
    const lines = yamlString.trim().split('\n')
    const manifest: any = {
      apiVersion: '',
      kind: '',
      metadata: { name: '' },
      spec: {}
    }

    const requiredFields = ['apiVersion', 'kind', 'metadata', 'spec']
    const foundFields = new Set<string>()

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      // Check for required top-level fields
      for (const field of requiredFields) {
        if (trimmed.startsWith(`${field}:`)) {
          foundFields.add(field)
          if (field === 'apiVersion' || field === 'kind') {
            manifest[field] = trimmed.split(':')[1].trim()
          }
        }
      }

      // Extract metadata.name
      if (trimmed.startsWith('name:') && foundFields.has('metadata')) {
        manifest.metadata.name = trimmed.split(':')[1].trim()
      }
    }

    // Validate required fields
    const missingFields = requiredFields.filter(field => !foundFields.has(field))
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }

    if (manifest.kind !== 'Queue') {
      throw new Error('Kind must be "Queue"')
    }

    if (!manifest.metadata.name) {
      throw new Error('Missing required field: metadata.name')
    }

    return manifest
  }

  const handleCreateQueue = async () => {
    try {
      const queueManifest = parseYamlToManifest(yaml)
      await createQueue({ queueManifest })
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create queue"
      })
    }
  }

  const handleReset = () => {
    setYaml(defaultQueueYaml)
    setStatus({ type: null, message: "" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Kubernetes Queue</DialogTitle>
          <DialogDescription>Enter your queue configuration in YAML format below.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="space-y-2">
            <Label htmlFor="yaml-input">Queue YAML Configuration</Label>
            <Textarea
              id="yaml-input"
              value={yaml}
              onChange={(e) => setYaml(e.target.value)}
              placeholder="Enter your queue YAML configuration..."
              className="min-h-[400px] font-mono text-sm resize-none"
              disabled={isCreating}
            />
          </div>

          {status.type && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              {status.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isCreating}>
            Reset
          </Button>
          <Button onClick={handleCreateQueue} disabled={isCreating || !yaml.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Queue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}