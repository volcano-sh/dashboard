"use client"
import { dump } from "js-yaml"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { validateQueueResources } from "@/lib/queue-validation"
import { cn } from "@/lib/utils"
import { trpc } from "@volcano/trpc/react"

import {
  applyManifestToForm,
  buildSpecFromForm,
  dumpOpts,
  emptyResource,
  parseQueueYaml,
  QueueFormFields,
  type ResourcePair
} from "./queue-form-shared"

interface QueueEditDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  handleRefresh: () => void
  queueName: string
  initialYaml: string
}

export function QueueEditDialog({
  open,
  setOpen,
  handleRefresh,
  queueName,
  initialYaml
}: QueueEditDialogProps) {
  const [mode, setMode] = React.useState<"form" | "yaml">("form")
  const [weight, setWeight] = React.useState("1")
  const [priority, setPriority] = React.useState("100")
  const [reclaimable, setReclaimable] = React.useState(true)
  const [guarantee, setGuarantee] = React.useState<ResourcePair>(() => emptyResource())
  const [capability, setCapability] = React.useState<ResourcePair>(() => emptyResource())
  const [deserved, setDeserved] = React.useState<ResourcePair>(() => emptyResource())
    const t = useTranslations("queues")
    const tc = useTranslations("common")
  const [yaml, setYaml] = React.useState(initialYaml)
  const [status, setStatus] = React.useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const loadFromYaml = React.useCallback((yamlString: string) => {
    const parsed = parseQueueYaml(yamlString)
    applyManifestToForm(parsed, {
      setQueueName: () => {},
      setWeight,
      setPriority,
      setReclaimable,
      setGuarantee,
      setCapability,
      setDeserved
    })
    return parsed
  }, [])

  React.useEffect(() => {
    if (open && initialYaml) {
      setYaml(initialYaml)
      setStatus({ type: null, message: "" })
      setMode("form")
      try {
        loadFromYaml(initialYaml)
      } catch {
        setMode("yaml")
      }
    }
  }, [open, initialYaml, loadFromYaml])

  const { mutateAsync: updateQueue, isPending: isUpdating } = trpc.queueRouter.updateQueue.useMutation({
    onSuccess: () => {
      setStatus({ type: "success", message: t("edit.success") })
      setTimeout(() => {
        setOpen(false)
        handleRefresh()
      }, 1000)
    },
    onError: (error) => {
      setStatus({ type: "error", message: error.message })
    }
  })

  React.useEffect(() => {
    if (!open || mode !== "form") return
    try {
      const spec = buildSpecFromForm({
        weight,
        priority,
        reclaimable,
        guarantee,
        capability,
        deserved
      })
      const nextYaml = dump(
        {
          apiVersion: "scheduling.volcano.sh/v1beta1",
          kind: "Queue",
          metadata: { name: queueName },
          spec
        },
        dumpOpts
      )
      setYaml((prev) => (prev === nextYaml ? prev : nextYaml))
    } catch {
      /* incomplete form */
    }
  }, [open, mode, queueName, weight, priority, reclaimable, guarantee, capability, deserved])

  React.useEffect(() => {
    if (!open || mode !== "yaml") return
    const id = window.setTimeout(() => {
      try {
        loadFromYaml(yaml)
      } catch {
        /* invalid YAML */
      }
    }, 350)
    return () => window.clearTimeout(id)
  }, [open, mode, yaml, loadFromYaml])

  const goForm = React.useCallback(() => {
    try {
      loadFromYaml(yaml)
      setStatus({ type: null, message: "" })
      setMode("form")
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not parse YAML into the form"
      })
    }
  }, [yaml, loadFromYaml])

  const goYaml = React.useCallback(() => {
    try {
      const spec = buildSpecFromForm({
        weight,
        priority,
        reclaimable,
        guarantee,
        capability,
        deserved
      })
      setYaml(
        dump(
          {
            apiVersion: "scheduling.volcano.sh/v1beta1",
            kind: "Queue",
            metadata: { name: queueName },
            spec
          },
          dumpOpts
        )
      )
      setStatus({ type: null, message: "" })
      setMode("yaml")
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Complete the form before switching to YAML"
      })
    }
  }, [queueName, weight, priority, reclaimable, guarantee, capability, deserved])

  const handleUpdateQueue = async () => {
    try {
      const spec =
        mode === "form"
          ? buildSpecFromForm({
              weight,
              priority,
              reclaimable,
              guarantee,
              capability,
              deserved
            })
          : parseQueueYaml(yaml).spec

      await updateQueue({
        name: queueName,
        updatedBody: { spec }
      })
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : t("edit.failed")
      })
    }
  }

  const handleReset = () => {
    setYaml(initialYaml)
    try {
      loadFromYaml(initialYaml)
    } catch {
      /* keep yaml mode values */
    }
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

  const formDisabled = !weight.trim() || (mode === "form" && !resourceValidation.valid)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "max-h-[85vh] flex flex-col",
          mode === "yaml" ? "max-w-4xl" : "max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle>Edit Queue: {queueName}</DialogTitle>
          <DialogDescription>
            Update queue settings using the form or YAML editor.
          </DialogDescription>
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
              nameReadOnly
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
              disabled={isUpdating}
              resourceValidation={resourceValidation}
            />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="yaml-input">{t("create.yamlLabel")}</Label>
              <Textarea
                id="yaml-input"
                value={yaml}
                onChange={(e) => setYaml(e.target.value)}
                placeholder={t("edit.yamlPlaceholder")}
                className="min-h-[360px] font-mono text-sm resize-none"
                disabled={isUpdating}
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
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={isUpdating}>
            Reset
          </Button>
          <Button
            onClick={handleUpdateQueue}
            disabled={isUpdating || (mode === "yaml" ? !yaml.trim() : formDisabled)}
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {tc("actions.updating")}
              </>
            ) : (
              t("edit.button")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
