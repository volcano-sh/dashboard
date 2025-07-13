"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data structure matching the original
const sampleData = [
  {
    metadata: { name: "gpu-queue" },
    status: {
      allocated: {
        memory: "8Gi",
        cpu: "4000m",
        pods: "10",
        "nvidia.com/gpu": "2",
      },
    },
    spec: {
      capability: {
        memory: "16Gi",
        cpu: "8000m",
        pods: "20",
        "nvidia.com/gpu": "4",
      },
    },
  },
  {
    metadata: { name: "cpu-intensive" },
    status: {
      allocated: {
        memory: "12Gi",
        cpu: "6000m",
        pods: "15",
        "nvidia.com/gpu": "0",
      },
    },
    spec: {
      capability: {
        memory: "32Gi",
        cpu: "16000m",
        pods: "50",
        "nvidia.com/gpu": "0",
      },
    },
  },
  {
    metadata: { name: "memory-heavy" },
    status: {
      allocated: {
        memory: "24Gi",
        cpu: "2000m",
        pods: "8",
        "nvidia.com/gpu": "1",
      },
    },
    spec: {
      capability: {
        memory: "64Gi",
        cpu: "8000m",
        pods: "30",
        "nvidia.com/gpu": "2",
      },
    },
  },
  {
    metadata: { name: "general-purpose" },
    status: {
      allocated: {
        memory: "4Gi",
        cpu: "2000m",
        pods: "12",
        "nvidia.com/gpu": "0",
      },
    },
    spec: {
      capability: {
        memory: "16Gi",
        cpu: "8000m",
        pods: "40",
        "nvidia.com/gpu": "0",
      },
    },
  },
  {
    metadata: { name: "ml-training" },
    status: {
      allocated: {
        memory: "32Gi",
        cpu: "8000m",
        pods: "5",
        "nvidia.com/gpu": "8",
      },
    },
    spec: {
      capability: {
        memory: "128Gi",
        cpu: "32000m",
        pods: "20",
        "nvidia.com/gpu": "16",
      },
    },
  },
]

interface QueueResourcesBarChartProps {
  data?: typeof sampleData
}

const QueueResourcesBarChart = ({ data = sampleData }: QueueResourcesBarChartProps) => {
  const [selectedResource, setSelectedResource] = useState("")

  // Get resource type options dynamically
  const resourceOptions = useMemo(() => {
    if (!data || data.length === 0) return []

    const resourceTypes = new Set<string>()

    // Traverse the queue data and get all resource types
    data.forEach((queue) => {
      const allocated = queue.status?.allocated || {}
      Object.keys(allocated).forEach((resource) => resourceTypes.add(resource))
    })

    // Convert resource type from Set to Array
    return Array.from(resourceTypes).map((resource) => ({
      value: resource,
      label: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Resources`.replace("Nvidia.com/gpu", "GPU"),
    }))
  }, [data])

  useEffect(() => {
    // If there is a resource option, select the first resource by default
    if (resourceOptions.length > 0 && !selectedResource) {
      setSelectedResource(resourceOptions[0].value)
    }
  }, [resourceOptions, selectedResource])

  const convertMemoryToGi = (memoryStr: string): number => {
    if (!memoryStr) return 0
    const value = Number.parseInt(memoryStr)
    if (memoryStr.includes("Gi")) return value
    if (memoryStr.includes("Mi")) return value / 1024 // Mi to Gi
    if (memoryStr.includes("Ki")) return value / 1024 / 1024 // Ki to Gi
    return value // default unit Gi
  }

  const convertCPUToCores = (cpuStr: string | number): number => {
    if (!cpuStr) return 0
    if (typeof cpuStr === "number") {
      return cpuStr
    }
    const value = Number.parseInt(cpuStr.toString())
    return cpuStr.toString().includes("m") ? value / 1000 : value // m is converted to the number of cores
  }

  // Process queue data and convert memory and CPU units
  const processData = (data: typeof sampleData) => {
    return data.reduce(
      (acc, queue) => {
        const name = queue.metadata.name
        const allocated = queue.status?.allocated || {}
        const capability = queue.spec?.capability || {}

        // Handle memory unit conversion
        const allocatedMemory = convertMemoryToGi(allocated.memory || "0")
        const capabilityMemory = convertMemoryToGi(capability.memory || "0")

        // Handle CPU unit conversion
        const allocatedCPU = convertCPUToCores(allocated.cpu || "0")
        const capabilityCPU = convertCPUToCores(capability.cpu || "0")

        acc[name] = {
          allocated: {
            ...allocated,
            memory: allocatedMemory,
            cpu: allocatedCPU,
          },
          capability: {
            ...capability,
            memory: capabilityMemory,
            cpu: capabilityCPU,
          },
        }
        return acc
      },
      {} as Record<string, any>,
    )
  }

  // Process queue data
  const processedData = useMemo(() => processData(data), [data])

  // Build chart data for Recharts
  const chartData = useMemo(() => {
    return Object.keys(processedData).map((queueName) => ({
      name: queueName,
      allocated: processedData[queueName].allocated[selectedResource] || 0,
      capacity: processedData[queueName].capability[selectedResource] || 0,
    }))
  }, [processedData, selectedResource])

  // Get Y-axis label
  const getYAxisLabel = () => {
    switch (selectedResource) {
      case "memory":
        return "Memory (Gi)"
      case "cpu":
        return "CPU Cores"
      case "pods":
        return "Pod Count"
      case "nvidia.com/gpu":
        return "GPU Count"
      default:
        return "Amount"
    }
  }

  const chartConfig = {
    allocated: {
      label: `${selectedResource.toUpperCase()} Allocated`,
      color: "hsl(var(--chart-1))",
    },
    capacity: {
      label: `${selectedResource.toUpperCase()} Capacity`,
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Queue Resources</CardTitle>
        <Select value={selectedResource} onValueChange={setSelectedResource}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select resource" />
          </SelectTrigger>
          <SelectContent>
            {resourceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                label={{
                  value: getYAxisLabel(),
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <Bar dataKey="allocated" fill="var(--color-allocated)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" fill="var(--color-capacity)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data available for selected resource type</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QueueResourcesBarChart
