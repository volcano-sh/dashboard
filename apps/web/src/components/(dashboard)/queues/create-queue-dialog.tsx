"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { dump, load, YAMLException } from "js-yaml"
import { AlertCircle, CheckCircle, ChevronDown, Loader2 } from "lucide-react"
import * as React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
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

type ResourcePair = { cpu: string; memory: string }

const emptyResource = (): ResourcePair => ({ cpu: "", memory: "" })

function resourcePairToSpec(pair: ResourcePair): Record<string, string> | null {
  const out: Record<string, string> = {}
  if (pair.cpu.trim()) out.cpu = pair.cpu.trim()
  if (pair.memory.trim()) out.memory = pair.memory.trim()
  return Object.keys(out).length > 0 ? out : null
}

function buildManifestFromForm(input: {
  name: string
  weight: string
  priority: string
  reclaimable: boolean
  guarantee: ResourcePair
  capability: ResourcePair
  deserved: ResourcePair
}) {
  const name = input.name.trim()
  if (!name) {
    throw new Error("Queue name is required")
  }
  const weight = parseInt(input.weight, 10)
  if (Number.isNaN(weight) || weight < 0) {
    throw new Error("Weight must be a non-negative integer")
  }
  const priority = parseInt(input.priority, 10)
  const pri = Number.isNaN(priority) ? 100 : priority

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spec: any = {
    weight,
    reclaimable: input.reclaimable,
    priority: pri
  }

  const g = resourcePairToSpec(input.guarantee)
  if (g) {
    spec.guarantee = { resource: g }
  }

  const cap = resourcePairToSpec(input.capability)
  if (cap) {
    spec.capability = cap
  }

  const des = resourcePairToSpec(input.deserved)
  if (des) {
    spec.deserved = des
  }

  return {
    apiVersion: "scheduling.volcano.sh/v1beta1",
    kind: "Queue",
    metadata: { name },
    spec
  }
}

function stringifyScalar(v: unknown): string {
  if (v === undefined || v === null) return ""
  return String(v)
}

function extractResourcePair(obj: unknown): ResourcePair {
  if (!obj || typeof obj !== "object") return emptyResource()
  const o = obj as Record<string, unknown>
  return {
    cpu: stringifyScalar(o.cpu),
    memory: stringifyScalar(o.memory)
  }
}

function guaranteeFromSpec(spec: Record<string, unknown> | undefined): ResourcePair {
  if (!spec?.guarantee || typeof spec.guarantee !== "object") return emptyResource()
  const g = spec.guarantee as Record<string, unknown>
  if (g.resource && typeof g.resource === "object") {
    return extractResourcePair(g.resource)
  }
  return extractResourcePair(g)
}

function applyManifestToForm(
  parsed: any,
  setters: {
    setQueueName: (v: string) => void
    setWeight: (v: string) => void
    setPriority: (v: string) => void
    setReclaimable: (v: boolean) => void
    setGuarantee: (v: ResourcePair) => void
    setCapability: (v: ResourcePair) => void
    setDeserved: (v: ResourcePair) => void
  }
) {
  const name = parsed.metadata?.name
  setters.setQueueName(typeof name === "string" ? name : stringifyScalar(name))

  const spec = parsed.spec && typeof parsed.spec === "object" ? (parsed.spec as Record<string, unknown>) : {}

  const w = spec.weight
  setters.setWeight(w !== undefined && w !== null ? String(w) : "1")

  const p = spec.priority
  setters.setPriority(p !== undefined && p !== null ? String(p) : "100")

  setters.setReclaimable(spec.reclaimable !== false)

  setters.setGuarantee(guaranteeFromSpec(spec))
  setters.setCapability(extractResourcePair(spec.capability))
  setters.setDeserved(extractResourcePair(spec.deserved))
}

const dumpOpts = { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false } as const

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
    }
  }, [open])

  const { mutateAsync: createQueue, isPending: isCreating } = trpc.queueRouter.createQueue.useMutation(
    {
      onSuccess: () => {
        setStatus({
          type: "success",
          message: "Queue created successfully!"
        })

        setOpen(false)
        handleRefresh()
      },
      onError: (error) => {
        setStatus({
          type: "error",
          message: error.message
        })
      }
    }
  )

  const parseYamlToManifest = React.useCallback((yamlString: string) => {
    try {
      const parsed = load(yamlString) as any

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid YAML: must be an object")
      }

      const requiredFields = ["apiVersion", "kind", "metadata", "spec"]
      const missingFields = requiredFields.filter((field) => !(field in parsed))

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`)
      }

      if (parsed.kind !== "Queue") {
        throw new Error('Kind must be "Queue"')
      }

      if (!parsed.metadata || typeof parsed.metadata !== "object") {
        throw new Error("Invalid metadata: must be an object")
      }

      if (!parsed.metadata.name || typeof parsed.metadata.name !== "string") {
        throw new Error("Missing required field: metadata.name")
      }

      if (!parsed.spec || typeof parsed.spec !== "object") {
        throw new Error("Invalid spec: must be an object")
      }

      return parsed
    } catch (error) {
      if (error instanceof YAMLException) {
        throw new Error(`YAML parsing error: ${error.message}`)
      }
      throw error
    }
  }, [])

  // Form → YAML while on Form tab (YAML stays ready when you switch views)
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
      /* incomplete form — keep existing YAML */
    }
  }, [open, mode, queueName, weight, priority, reclaimable, guarantee, capability, deserved])

  // YAML → Form while on YAML tab (debounced while typing)
  React.useEffect(() => {
    if (!open || mode !== "yaml") return
    const id = window.setTimeout(() => {
      try {
        const m = parseYamlToManifest(yaml)
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
        /* invalid or partial YAML — keep last applied form values */
      }
    }, 350)
    return () => window.clearTimeout(id)
  }, [open, mode, yaml, parseYamlToManifest])

  const goForm = React.useCallback(() => {
    try {
      const m = parseYamlToManifest(yaml)
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
  }, [yaml, parseYamlToManifest])

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
    } catch {
      /* incomplete form — keep current YAML; user can still edit raw YAML */
    }
    setStatus({ type: null, message: "" })
    setMode("yaml")
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
          : parseYamlToManifest(yaml)
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

  const formDisabled = !queueName.trim() || !weight.trim()

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
          <DialogDescription>
            {mode === "form"
              ? "Form and YAML stay in sync: edits in one view update the other when you switch tabs (YAML is also updated live while you use the form)."
              : "Form fields update from valid YAML as you type. Switch to Form to edit structured fields."}
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
            <>
              <div className="space-y-2">
                <Label htmlFor="queue-name">
                  Queue Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="queue-name"
                  value={queueName}
                  onChange={(e) => setQueueName(e.target.value)}
                  placeholder="e.g. my-queue"
                  disabled={isCreating}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="queue-weight">
                    Weight <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="queue-weight"
                    type="number"
                    min={0}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="queue-priority">Priority</Label>
                  <Input
                    id="queue-priority"
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reclaimable"
                  checked={reclaimable}
                  onCheckedChange={(v) => setReclaimable(v === true)}
                  disabled={isCreating}
                />
                <Label htmlFor="reclaimable" className="text-sm font-normal cursor-pointer">
                  Reclaimable
                </Label>
              </div>

              <ResourceCollapsible
                title="Guarantee Resources (Optional)"
                pair={guarantee}
                onChange={setGuarantee}
                disabled={isCreating}
                helper="Maps to spec.guarantee.resource (cpu / memory)."
              />
              <ResourceCollapsible
                title="Capability Resources (Optional)"
                pair={capability}
                onChange={setCapability}
                disabled={isCreating}
                helper="Maps to spec.capability."
              />
              <ResourceCollapsible
                title="Deserved Resources (Optional)"
                pair={deserved}
                onChange={setDeserved}
                disabled={isCreating}
                helper="Maps to spec.deserved (capacity plugin)."
              />
            </>
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

function ResourceCollapsible({
  title,
  pair,
  onChange,
  disabled,
  helper
}: {
  title: string
  pair: ResourcePair
  onChange: (p: ResourcePair) => void
  disabled: boolean
  helper: string
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium hover:bg-muted/60"
        type="button"
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border border-t-0 border-border rounded-b-md p-3">
        <p className="text-xs text-muted-foreground">{helper}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">CPU</Label>
            <Input
              placeholder='e.g. "2"'
              value={pair.cpu}
              onChange={(e) => onChange({ ...pair, cpu: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Memory</Label>
            <Input
              placeholder="e.g. 4Gi"
              value={pair.memory}
              onChange={(e) => onChange({ ...pair, memory: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
