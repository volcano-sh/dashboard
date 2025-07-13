"use client"

import * as React from "react"
import { ChevronDown, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CustomResource {
  key: string
  value: string
}


export function CreateQueueDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [queueName, setQueueName] = React.useState("")
  const [weight, setWeight] = React.useState("")
  const [reclaimable, setReclaimable] = React.useState(true)

  // Guarantee Resources
  const [guaranteeCpu, setGuaranteeCpu] = React.useState("")
  const [guaranteeMemory, setGuaranteeMemory] = React.useState("")
  const [guaranteeCustomResources, setGuaranteeCustomResources] = React.useState<CustomResource[]>([])

  // Capability Resources
  const [capabilityCpu, setCapabilityCpu] = React.useState("")
  const [capabilityMemory, setCapabilityMemory] = React.useState("")
  const [capabilityCustomResources, setCapabilityCustomResources] = React.useState<CustomResource[]>([])

  // Deserved Resources
  const [deservedCpu, setDeservedCpu] = React.useState("")
  const [deservedMemory, setDeservedMemory] = React.useState("")
  const [deservedCustomResources, setDeservedCustomResources] = React.useState<CustomResource[]>([
    { key: "", value: "" },
  ])

  const addCustomResource = (type: "guarantee" | "capability" | "deserved") => {
    const newResource = { key: "", value: "" }
    if (type === "guarantee") {
      setGuaranteeCustomResources([...guaranteeCustomResources, newResource])
    } else if (type === "capability") {
      setCapabilityCustomResources([...capabilityCustomResources, newResource])
    } else {
      setDeservedCustomResources([...deservedCustomResources, newResource])
    }
  }

  const removeCustomResource = (type: "guarantee" | "capability" | "deserved", index: number) => {
    if (type === "guarantee") {
      setGuaranteeCustomResources(guaranteeCustomResources.filter((_, i) => i !== index))
    } else if (type === "capability") {
      setCapabilityCustomResources(capabilityCustomResources.filter((_, i) => i !== index))
    } else {
      setDeservedCustomResources(deservedCustomResources.filter((_, i) => i !== index))
    }
  }

  const updateCustomResource = (
    type: "guarantee" | "capability" | "deserved",
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    if (type === "guarantee") {
      const updated = [...guaranteeCustomResources]
      updated[index][field] = value
      setGuaranteeCustomResources(updated)
    } else if (type === "capability") {
      const updated = [...capabilityCustomResources]
      updated[index][field] = value
      setCapabilityCustomResources(updated)
    } else {
      const updated = [...deservedCustomResources]
      updated[index][field] = value
      setDeservedCustomResources(updated)
    }
  }

  const handleCreate = () => {
    // Handle form submission here
    console.log({
      queueName,
      weight,
      reclaimable,
      guaranteeResources: {
        cpu: guaranteeCpu,
        memory: guaranteeMemory,
        custom: guaranteeCustomResources,
      },
      capabilityResources: {
        cpu: capabilityCpu,
        memory: capabilityMemory,
        custom: capabilityCustomResources,
      },
      deservedResources: {
        cpu: deservedCpu,
        memory: deservedMemory,
        custom: deservedCustomResources,
      },
    })
    setOpen(false)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-orange-600">Create a Queue</DialogTitle>
          <DialogDescription className="sr-only">Create a new queue with resource configurations</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="queue-name">
                Queue Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="queue-name"
                value={queueName}
                onChange={(e) => setQueueName(e.target.value)}
                placeholder="Enter queue name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">
                Weight <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reclaimable"
                checked={reclaimable}
                onCheckedChange={(checked) => setReclaimable(checked as boolean)}
              />
              <Label htmlFor="reclaimable">Reclaimable</Label>
            </div>
          </div>

          {/* Guarantee Resources */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
              <span className="font-medium text-gray-700">Guarantee Resources (Optional)</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guarantee-cpu">CPU</Label>
                  <Input
                    id="guarantee-cpu"
                    value={guaranteeCpu}
                    onChange={(e) => setGuaranteeCpu(e.target.value)}
                    placeholder="Enter CPU"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guarantee-memory">Memory</Label>
                  <Input
                    id="guarantee-memory"
                    value={guaranteeMemory}
                    onChange={(e) => setGuaranteeMemory(e.target.value)}
                    placeholder="Enter Memory"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Custom Scalar Resources</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addCustomResource("guarantee")}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {guaranteeCustomResources.map((resource, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={resource.key}
                      onChange={(e) => updateCustomResource("guarantee", index, "key", e.target.value)}
                      placeholder="Key"
                    />
                    <Input
                      value={resource.value}
                      onChange={(e) => updateCustomResource("guarantee", index, "value", e.target.value)}
                      placeholder="Value"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomResource("guarantee", index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Capability Resources */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
              <span className="font-medium text-gray-700">Capability Resources (Optional)</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capability-cpu">CPU</Label>
                  <Input
                    id="capability-cpu"
                    value={capabilityCpu}
                    onChange={(e) => setCapabilityCpu(e.target.value)}
                    placeholder="Enter CPU"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capability-memory">Memory</Label>
                  <Input
                    id="capability-memory"
                    value={capabilityMemory}
                    onChange={(e) => setCapabilityMemory(e.target.value)}
                    placeholder="Enter Memory"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Custom Scalar Resources</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addCustomResource("capability")}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {capabilityCustomResources.map((resource, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={resource.key}
                      onChange={(e) => updateCustomResource("capability", index, "key", e.target.value)}
                      placeholder="Key"
                    />
                    <Input
                      value={resource.value}
                      onChange={(e) => updateCustomResource("capability", index, "value", e.target.value)}
                      placeholder="Value"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomResource("capability", index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Deserved Resources */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
              <span className="font-medium text-gray-700">Deserved Resources (Optional)</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deserved-cpu">CPU</Label>
                  <Input
                    id="deserved-cpu"
                    value={deservedCpu}
                    onChange={(e) => setDeservedCpu(e.target.value)}
                    placeholder="Enter CPU"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deserved-memory">Memory</Label>
                  <Input
                    id="deserved-memory"
                    value={deservedMemory}
                    onChange={(e) => setDeservedMemory(e.target.value)}
                    placeholder="Enter Memory"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Custom Scalar Resources</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addCustomResource("deserved")}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {deservedCustomResources.map((resource, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={resource.key}
                      onChange={(e) => updateCustomResource("deserved", index, "key", e.target.value)}
                      placeholder="Key"
                    />
                    <Input
                      value={resource.value}
                      onChange={(e) => updateCustomResource("deserved", index, "value", e.target.value)}
                      placeholder="Value"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomResource("deserved", index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white">
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
