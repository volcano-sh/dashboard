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
    const lines = yamlString.trim().split('\n')
    const manifest: any = {
      apiVersion: '',
      kind: '',
      metadata: { name: '' },
      spec: { containers: [] }
    }

    const requiredFields = ['apiVersion', 'kind', 'metadata', 'spec']
    const foundFields = new Set<string>()
    let currentSection = ''
    let currentSubSection = ''
    let currentContainer: any = null
    let inContainers = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      for (const field of requiredFields) {
        if (trimmed.startsWith(`${field}:`)) {
          foundFields.add(field)
          if (field === 'apiVersion' || field === 'kind') {
            manifest[field] = trimmed.split(':')[1].trim()
          }
          currentSection = field
          currentSubSection = ''
        }
      }

      if (trimmed.startsWith('name:') && currentSection === 'metadata') {
        manifest.metadata.name = trimmed.split(':')[1].trim()
      }

      if (currentSection === 'spec') {
        if (trimmed.startsWith('containers:')) {
          inContainers = true
          currentSubSection = 'containers'
        } else if (trimmed.startsWith('- name:') && inContainers) {
          if (currentContainer) {
            manifest.spec.containers.push(currentContainer)
          }
          currentContainer = { name: trimmed.split(':')[1].trim() }
        } else if (trimmed.startsWith('image:') && currentContainer) {
          currentContainer.image = trimmed.split(':')[1].trim()
        } else if (trimmed.startsWith('ports:') && currentContainer) {
          currentContainer.ports = []
          currentSubSection = 'ports'
        } else if (trimmed.startsWith('- containerPort:') && currentSubSection === 'ports' && currentContainer) {
          const port = parseInt(trimmed.split(':')[1].trim())
          currentContainer.ports.push({ containerPort: port })
        } else if (trimmed.startsWith('restartPolicy:') && currentSection === 'spec') {
          manifest.spec.restartPolicy = trimmed.split(':')[1].trim()
        }
      }
    }

    if (currentContainer) {
      manifest.spec.containers.push(currentContainer)
    }

    const missingFields = requiredFields.filter(field => !foundFields.has(field))
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }

    if (manifest.kind !== 'Pod') {
      throw new Error('Kind must be "Pod"')
    }

    if (!manifest.metadata.name) {
      throw new Error('Missing required field: metadata.name')
    }

    if (!manifest.spec.containers || manifest.spec.containers.length === 0) {
      throw new Error('Pod spec must include at least one container')
    }

    return manifest
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
