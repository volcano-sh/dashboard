"use client"
import { dump } from "js-yaml"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import * as React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { validateQueueResources } from "@/lib/queue-validation"
import { cn } from "@/lib/utils"
import { trpc } from "@volcano/trpc/react"

import {
  applyManifestToForm,
  buildManifestFromForm,
  dumpOpts,
  emptyResource,
  parseQueueYaml,
  QueueFormFields,
  type ResourcePair
} from "./queue-form-shared"

const defaultQueueYaml = `apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: my-queue
spec:
  capability:
    cpu: "8"
    memory: 16Gi
  deserved:
    cpu: "4"
    memory: 8Gi
  guarantee:
    resource:
      cpu: "2"
      memory: 4Gi
  priority: 100
  reclaimable: true
  weight: 1`

export function CreateQueueDialog({
  open,
  setOpen,
  handleRefresh
}: {
  open: boolean
  setOpen: (open: boolean) => void
  handleRefresh: () => void
}) {
  const [mode, setMode] = React.useState<"form" | "yaml">("form")
  const [queueName, setQueueName] = React.useState("")
  const [weight, setWeight] = React.useState("1")
  const [priority, setPriority] = React.useState("100")
  const [reclaimable, setReclaimable] = React.useState(true)
  const [guarantee, setGuarantee] = React.useState<ResourcePair>(() => emptyResource())
  const [capability, setCapability] = React.useState<ResourcePair>(() => emptyResource())
  const [deserved, setDeserved] = React.useState<ResourcePair>(() => emptyResource())
  const [yaml, setYaml] = React.useState(defaultQueueYaml)
  const [status, setStatus] = React.useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const resetForm = React.useCallback(() => {
    setQueueName("")
    setWeight("1")
    setPriority("100")
    setReclaimable(true)
    setGuarantee(emptyResource())
    setCapability(emptyResource())
    setDeserved(emptyResource())
  }, [])

  React.useEffect(() => {
    if (open) {
      setStatus({ type: null, message: "" })
      setMode("form")
      setYaml(defaultQueueYaml)
      resetForm()
    }
  }, [open, resetForm])

  const { mutateAsync: createQueue, isPending: isCreating } = trpc.queueRouter.createQueue.useMutation({
    onSuccess: () => {
      setStatus({ type: "success", message: "Queue created successfully!" })
      setOpen(false)
      handleRefresh()
    },
    onError: (error) => {
      setStatus({ type: "error", message: error.message })
    }
  })

  React.useEffect(() => {
    if (!open || mode !== "form") return
    try {
      const m = buildManifestFromForm({
        name: queueName,
        weight,
        priority,
        reclaimable,
        guarantee,
        capability,
        deserved
      })
      const nextYaml = dump(m, dumpOpts)
      setYaml((prev) => (prev === nextYaml ? prev : nextYaml))
    } catch {
      /* incomplete form */
    }
  }, [open, mode, queueName, weight, priority, reclaimable, guarantee, capability, deserved])

  React.useEffect(() => {
    if (!open || mode !== "yaml") return
    const id = window.setTimeout(() => {
      try {
        const m = parseQueueYaml(yaml)
        applyManifestToForm(m, {
          setQueueName,
          setWeight,
          setPriority,
          setReclaimable,
          setGuarantee,
          setCapability,
          setDeserved
        })
      } catch {
        /* invalid YAML */
      }
    }, 350)
    return () => window.clearTimeout(id)
  }, [open, mode, yaml])

  const goForm = React.useCallback(() => {
    try {
      const m = parseQueueYaml(yaml)
      applyManifestToForm(m, {
        setQueueName,
        setWeight,
        setPriority,
        setReclaimable,
        setGuarantee,
        setCapability,
        setDeserved
      })
      setStatus({ type: null, message: "" })
      setMode("form")
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not parse YAML into the form"
      })
    }
  }, [yaml])

  const goYaml = React.useCallback(() => {
    try {
      const m = buildManifestFromForm({
        name: queueName,
        weight,
        priority,
        reclaimable,
        guarantee,
        capability,
        deserved
      })
      setYaml(dump(m, dumpOpts))
      setStatus({ type: null, message: "" })
      setMode("yaml")
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Complete the form before switching to YAML"
      })
    }
  }, [queueName, weight, priority, reclaimable, guarantee, capability, deserved])

  const handleCreateQueue = async () => {
    try {
      const queueManifest =
        mode === "form"
          ? buildManifestFromForm({
              name: queueName,
              weight,
              priority,
              reclaimable,
              guarantee,
              capability,
              deserved
            })
          : parseQueueYaml(yaml)
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
    resetForm()
    setStatus({ type: null, message: "" })
  }

  const handleGuaranteeChange = React.useCallback((next: ResourcePair) => {
    setGuarantee(next)
    setDeserved((prev) => ({
      cpu: prev.cpu.trim() ? prev.cpu : next.cpu,
      memory: prev.memory.trim() ? prev.memory : next.memory
    }))
  }, [])

  const resourceValidation = React.useMemo(
    () => validateQueueResources(guarantee, capability, deserved),
    [guarantee, capability, deserved]
  )

  const formDisabled =
    !queueName.trim() || !weight.trim() || (mode === "form" && !resourceValidation.valid)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "max-h-[85vh] flex flex-col",
          mode === "yaml" ? "max-w-4xl" : "max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle>Create a Queue</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 border-b pb-2">
          <Button type="button" variant={mode === "form" ? "default" : "outline"} size="sm" onClick={goForm}>
            Form
          </Button>
          <Button type="button" variant={mode === "yaml" ? "default" : "outline"} size="sm" onClick={goYaml}>
            YAML
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {mode === "form" ? (
            <QueueFormFields
              queueName={queueName}
              onQueueNameChange={setQueueName}
              weight={weight}
              onWeightChange={setWeight}
              priority={priority}
              onPriorityChange={setPriority}
              reclaimable={reclaimable}
              onReclaimableChange={setReclaimable}
              guarantee={guarantee}
              onGuaranteeChange={handleGuaranteeChange}
              capability={capability}
              onCapabilityChange={setCapability}
              deserved={deserved}
              onDeservedChange={setDeserved}
              disabled={isCreating}
              resourceValidation={resourceValidation}
            />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="yaml-input">Queue YAML Configuration</Label>
              <Textarea
                id="yaml-input"
                value={yaml}
                onChange={(e) => setYaml(e.target.value)}
                placeholder="Enter your queue YAML configuration..."
                className="min-h-[360px] font-mono text-sm resize-none"
                disabled={isCreating}
              />
            </div>
          )}

          {status.type && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              {status.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={isCreating}>
            Reset
          </Button>
          <Button
            onClick={handleCreateQueue}
            disabled={isCreating || (mode === "yaml" ? !yaml.trim() : formDisabled)}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
