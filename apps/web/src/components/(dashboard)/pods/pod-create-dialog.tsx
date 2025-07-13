"use client"

import * as React from "react"
import { Plus, Loader2, CheckCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

export function CreatePodDialog({open, setOpen}:{open: boolean, setOpen: (open: boolean) => void}) {
  const [yaml, setYaml] = React.useState(defaultPodYaml)
  const [isCreating, setIsCreating] = React.useState(false)
  const [status, setStatus] = React.useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const validateYaml = (yamlString: string) => {
    try {
      // Basic validation - check if it's valid YAML structure
      const lines = yamlString.trim().split("\n")

      // Check for required Kubernetes fields
      const hasApiVersion = lines.some((line) => line.trim().startsWith("apiVersion:"))
      const hasKind = lines.some((line) => line.trim().startsWith("kind:"))
      const hasMetadata = lines.some((line) => line.trim().startsWith("metadata:"))
      const hasSpec = lines.some((line) => line.trim().startsWith("spec:"))

      if (!hasApiVersion) throw new Error("Missing required field: apiVersion")
      if (!hasKind) throw new Error("Missing required field: kind")
      if (!hasMetadata) throw new Error("Missing required field: metadata")
      if (!hasSpec) throw new Error("Missing required field: spec")

      // Check if kind is Pod
      const kindLine = lines.find((line) => line.trim().startsWith("kind:"))
      if (kindLine && !kindLine.includes("Pod")) {
        throw new Error('Kind must be "Pod"')
      }

      return { valid: true, error: null }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Invalid YAML format",
      }
    }
  }

  const handleCreatePod = async () => {
    const validation = validateYaml(yaml)

    if (!validation.valid) {
      setStatus({
        type: "error",
        message: validation.error || "Invalid YAML format",
      })
      return
    }

    setIsCreating(true)
    setStatus({ type: null, message: "" })

    try {
      // Simulate API call to create pod
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real implementation, you would call your Kubernetes API here
      // const response = await fetch('/api/pods', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/yaml' },
      //   body: yaml
      // })

      setStatus({
        type: "success",
        message: "Pod created successfully!",
      })

      // Reset form after successful creation
      setTimeout(() => {
        setOpen(false)
        setYaml(defaultPodYaml)
        setStatus({ type: null, message: "" })
      }, 2000)
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create pod",
      })
    } finally {
      setIsCreating(false)
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
