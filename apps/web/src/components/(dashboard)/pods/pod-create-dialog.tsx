"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { load, YAMLException } from "js-yaml"
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

const defaultPodYaml = `apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  labels:
    app: my-app
spec:
  containers:
  - name: my-container
    image: nginx:latest
    ports:
    - containerPort: 80
  restartPolicy: Always`

export function CreatePodDialog({ open, setOpen, handleRefresh }: { open: boolean, setOpen: (open: boolean) => void, handleRefresh: () => void }) {
  const [yaml, setYaml] = React.useState(defaultPodYaml)
  const [status, setStatus] = React.useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  React.useEffect(() => {
    if (open) {
      setStatus({ type: null, message: "" })
    }
  }, [open])

  const { mutateAsync: createPod, isPending: isCreating } = trpc.podRouter.createPod.useMutation({
    onSuccess: () => {
      setStatus({
        type: "success",
        message: "Pod created successfully!",
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
  })



  const parseYamlToManifest = (yamlString: string) => {
    try {
      // Parse YAML using js-yaml library
      const parsed = load(yamlString) as any

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid YAML: must be an object')
      }

      // Validate required fields
      const requiredFields = ['apiVersion', 'kind', 'metadata', 'spec']
      const missingFields = requiredFields.filter(field => !(field in parsed))

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate kind
      if (parsed.kind !== 'Pod') {
        throw new Error('Kind must be "Pod"')
      }

      // Validate metadata
      if (!parsed.metadata || typeof parsed.metadata !== 'object') {
        throw new Error('Invalid metadata: must be an object')
      }

      if (!parsed.metadata.name || typeof parsed.metadata.name !== 'string') {
        throw new Error('Missing required field: metadata.name')
      }

      // Validate spec
      if (!parsed.spec || typeof parsed.spec !== 'object') {
        throw new Error('Invalid spec: must be an object')
      }

      // Validate containers
      if (!parsed.spec.containers || !Array.isArray(parsed.spec.containers)) {
        throw new Error('Pod spec must include containers array')
      }

      if (parsed.spec.containers.length === 0) {
        throw new Error('Pod spec must include at least one container')
      }

      // Validate each container
      for (let i = 0; i < parsed.spec.containers.length; i++) {
        const container = parsed.spec.containers[i]
        if (!container || typeof container !== 'object') {
          throw new Error(`Container at index ${i} must be an object`)
        }

        if (!container.name || typeof container.name !== 'string') {
          throw new Error(`Container at index ${i} must have a name`)
        }

        if (!container.image || typeof container.image !== 'string') {
          throw new Error(`Container at index ${i} must have an image`)
        }
      }

      return parsed
    } catch (error) {
      if (error instanceof YAMLException) {
        throw new Error(`YAML parsing error: ${error.message}`)
      }
      throw error
    }
  }

  const handleCreatePod = async () => {
    try {
      const podManifest = parseYamlToManifest(yaml)
      await createPod({ podManifest })
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create pod"
      })
    }
  }

  const handleReset = () => {
    setYaml(defaultPodYaml)
    setStatus({ type: null, message: "" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Kubernetes Pod</DialogTitle>
          <DialogDescription>Enter your pod configuration in YAML format below.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="space-y-2">
            <Label htmlFor="yaml-input">Pod YAML Configuration</Label>
            <Textarea
              id="yaml-input"
              value={yaml}
              onChange={(e) => setYaml(e.target.value)}
              placeholder="Enter your pod YAML configuration..."
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
          <Button onClick={handleCreatePod} disabled={isCreating || !yaml.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Pod"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
