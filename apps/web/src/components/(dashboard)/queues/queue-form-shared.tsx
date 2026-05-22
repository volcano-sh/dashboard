"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { load, YAMLException } from "js-yaml"
import { ChevronDown } from "lucide-react"
import * as React from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  hasCapabilityValues,
  hasGuaranteeValues,
  normalizeDeservedFromGuarantee,
  type QueueResourceValidation,
  type ResourceFieldErrors,
  type ResourcePair,
  validateQueueManifestSpec,
  validateQueueResources
} from "@/lib/queue-validation"
import { cn } from "@/lib/utils"

export type { ResourcePair, ResourceFieldErrors }

export const dumpOpts = { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false } as const

export const emptyResource = (): ResourcePair => ({ cpu: "", memory: "" })

export function resourcePairToSpec(pair: ResourcePair): Record<string, string> | null {
  const out: Record<string, string> = {}
  if (pair.cpu.trim()) out.cpu = pair.cpu.trim()
  if (pair.memory.trim()) out.memory = pair.memory.trim()
  return Object.keys(out).length > 0 ? out : null
}

export function buildSpecFromForm(input: {
  weight: string
  priority: string
  reclaimable: boolean
  guarantee: ResourcePair
  capability: ResourcePair
  deserved: ResourcePair
}) {
  const weight = parseInt(input.weight, 10)
  if (Number.isNaN(weight) || weight < 0) {
    throw new Error("Weight must be a non-negative integer")
  }
  const priority = parseInt(input.priority, 10)
  const pri = Number.isNaN(priority) ? 100 : priority

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

  const normalizedDeserved = normalizeDeservedFromGuarantee(input.guarantee, input.deserved)
  const des = resourcePairToSpec(normalizedDeserved)
  if (des) {
    spec.deserved = des
  }

  const resourceValidation = validateQueueResources(
    input.guarantee,
    input.capability,
    input.deserved
  )
  if (!resourceValidation.valid) {
    throw new Error(resourceValidation.messages[0] ?? "Invalid resource configuration")
  }

  return spec
}

export function buildManifestFromForm(input: {
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

  return {
    apiVersion: "scheduling.volcano.sh/v1beta1",
    kind: "Queue",
    metadata: { name },
    spec: buildSpecFromForm(input)
  }
}

function stringifyScalar(v: unknown): string {
  if (v === undefined || v === null) return ""
  return String(v)
}

export function extractResourcePair(obj: unknown): ResourcePair {
  if (!obj || typeof obj !== "object") return emptyResource()
  const o = obj as Record<string, unknown>
  return {
    cpu: stringifyScalar(o.cpu),
    memory: stringifyScalar(o.memory)
  }
}

export function guaranteeFromSpec(spec: Record<string, unknown> | undefined): ResourcePair {
  if (!spec?.guarantee || typeof spec.guarantee !== "object") return emptyResource()
  const g = spec.guarantee as Record<string, unknown>
  if (g.resource && typeof g.resource === "object") {
    return extractResourcePair(g.resource)
  }
  return extractResourcePair(g)
}

export function applyManifestToForm(
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

export function parseQueueYaml(yamlString: string) {
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

    const specError = validateQueueManifestSpec(parsed.spec as Record<string, unknown>)
    if (specError) {
      throw new Error(specError)
    }

    return parsed
  } catch (error) {
    if (error instanceof YAMLException) {
      throw new Error(`YAML parsing error: ${error.message}`)
    }
    throw error
  }
}

export function ResourceCollapsible({
  title,
  pair,
  onChange,
  disabled,
  helper,
  errors,
  defaultOpen = false
}: {
  title: string
  pair: ResourcePair
  onChange: (p: ResourcePair) => void
  disabled: boolean
  helper: string
  errors?: ResourceFieldErrors
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  React.useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen])
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
              aria-invalid={Boolean(errors?.cpu)}
              className={cn(errors?.cpu && "border-destructive focus:ring-destructive focus:border-destructive")}
            />
            {errors?.cpu && <p className="text-xs text-destructive">{errors.cpu}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Memory</Label>
            <Input
              placeholder="e.g. 4Gi"
              value={pair.memory}
              onChange={(e) => onChange({ ...pair, memory: e.target.value })}
              disabled={disabled}
              aria-invalid={Boolean(errors?.memory)}
              className={cn(errors?.memory && "border-destructive focus:ring-destructive focus:border-destructive")}
            />
            {errors?.memory && <p className="text-xs text-destructive">{errors.memory}</p>}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function QueueFormFields({
  queueName,
  onQueueNameChange,
  nameReadOnly = false,
  weight,
  onWeightChange,
  priority,
  onPriorityChange,
  reclaimable,
  onReclaimableChange,
  guarantee,
  onGuaranteeChange,
  capability,
  onCapabilityChange,
  deserved,
  onDeservedChange,
  disabled,
  resourceValidation
}: {
  queueName: string
  onQueueNameChange?: (v: string) => void
  nameReadOnly?: boolean
  weight: string
  onWeightChange: (v: string) => void
  priority: string
  onPriorityChange: (v: string) => void
  reclaimable: boolean
  onReclaimableChange: (v: boolean) => void
  guarantee: ResourcePair
  onGuaranteeChange: (p: ResourcePair) => void
  capability: ResourcePair
  onCapabilityChange: (p: ResourcePair) => void
  deserved: ResourcePair
  onDeservedChange: (p: ResourcePair) => void
  disabled: boolean
  resourceValidation: QueueResourceValidation
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="queue-name">
          Queue Name {!nameReadOnly && <span className="text-destructive">*</span>}
        </Label>
        <Input
          id="queue-name"
          value={queueName}
          onChange={(e) => onQueueNameChange?.(e.target.value)}
          placeholder="e.g. my-queue"
          disabled={disabled || nameReadOnly}
          readOnly={nameReadOnly}
          className={nameReadOnly ? "bg-muted cursor-not-allowed" : undefined}
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
            onChange={(e) => onWeightChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="queue-priority">Priority</Label>
          <Input
            id="queue-priority"
            type="number"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="reclaimable"
          checked={reclaimable}
          onCheckedChange={(v) => onReclaimableChange(v === true)}
          disabled={disabled}
        />
        <Label htmlFor="reclaimable" className="text-sm font-normal cursor-pointer">
          Reclaimable
        </Label>
      </div>

      <ResourceCollapsible
        title="Guarantee Resources (Optional)"
        pair={guarantee}
        onChange={onGuaranteeChange}
        disabled={disabled}
        helper="Maps to spec.guarantee.resource (cpu / memory)."
      />
      <ResourceCollapsible
        title={
          hasCapabilityValues(capability)
            ? "Capability Resources"
            : "Capability Resources (Optional)"
        }
        pair={capability}
        onChange={onCapabilityChange}
        disabled={disabled}
        helper="Upper limit for deserved. Deserved must be ≤ capability for each resource you set."
        errors={resourceValidation.capabilityErrors}
        defaultOpen={hasCapabilityValues(capability)}
      />
      <ResourceCollapsible
        title={
          hasGuaranteeValues(guarantee)
            ? "Deserved Resources (required when guarantee is set)"
            : "Deserved Resources (Optional)"
        }
        pair={deserved}
        onChange={onDeservedChange}
        disabled={disabled}
        helper="Must be ≥ guarantee and ≤ capability for each resource you set."
        errors={resourceValidation.deservedErrors}
        defaultOpen={hasGuaranteeValues(guarantee) || hasCapabilityValues(capability)}
      />
      {!resourceValidation.valid && (
        <p className="text-xs text-destructive">{resourceValidation.messages[0]}</p>
      )}
    </>
  )
}
