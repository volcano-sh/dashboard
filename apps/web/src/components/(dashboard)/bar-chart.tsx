"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2Icon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

interface QueueMetrics {
  name: string
  weight: number
  reclaimable: boolean
  inqueue: number
  pending: number
  running: number
  unknown: number
}

interface QueueResourcesBarChartProps {
  data?: QueueMetrics[]
  isLoading?: boolean
}

const BarChartSkeleton = () => (
  <Card className="h-full flex flex-col">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-[180px]" />
    </CardHeader>
    <CardContent className="flex items-center justify-center h-[300px]">
      <div className="flex flex-col items-center space-y-2">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading queue data...</p>
      </div>
    </CardContent>
  </Card>
);

const QueueResourcesBarChart = ({ data = [], isLoading = false }: QueueResourcesBarChartProps) => {
  const [selectedResource, setSelectedResource] = useState("")

  // Transform API data to match the expected format
  const transformedData = useMemo(() => {
    return data.map(queue => ({
      metadata: { name: queue.name },
      status: {
        allocated: {
          inqueue: queue.inqueue,
          pending: queue.pending,
          running: queue.running,
          unknown: queue.unknown,
        },
      },
      spec: {
        capability: {
          inqueue: queue.inqueue + queue.pending + queue.running + queue.unknown,
          pending: queue.pending + queue.running + queue.unknown,
          running: queue.running + queue.unknown,
          unknown: queue.unknown,
        },
      },
    }));
  }, [data]);

  // Get resource type options dynamically
  const resourceOptions = useMemo(() => {
    if (!transformedData || transformedData.length === 0) return []

    const resourceTypes = new Set<string>()

    transformedData.forEach((queue) => {
      const allocated = queue.status?.allocated || {}
      Object.keys(allocated).forEach((resource) => resourceTypes.add(resource))
    })

    return Array.from(resourceTypes).map((resource) => ({
      value: resource,
      label: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Resources`.replace("Nvidia.com/gpu", "GPU"),
    }))
  }, [transformedData])

  useEffect(() => {
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

  const processData = (data: typeof transformedData) => {
    return data.reduce(
      (acc, queue) => {
        const name = queue.metadata.name
        const allocated = queue.status?.allocated || {}
        const capability = queue.spec?.capability || {}

        acc[name] = {
          allocated: {
            ...allocated,
          },
          capability: {
            ...capability,
          },
        }
        return acc
      },
      {} as Record<string, any>,
    )
  }

  const processedData = useMemo(() => processData(transformedData), [transformedData])

  const chartData = useMemo(() => {
    return Object.keys(processedData).map((queueName) => ({
      name: queueName,
      allocated: processedData[queueName].allocated[selectedResource] || 0,
      capacity: processedData[queueName].capability[selectedResource] || 0,
    }))
  }, [processedData, selectedResource])

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
      case "inqueue":
        return "In Queue Count"
      case "pending":
        return "Pending Count"
      case "running":
        return "Running Count"
      case "unknown":
        return "Unknown Count"
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

  if (isLoading) {
    return <BarChartSkeleton />;
  }

  if (transformedData.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Queue Resources</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-muted-foreground">No queue data available</p>
            <p className="text-sm text-muted-foreground">Create a queue to see resource information</p>
          </div>
        </CardContent>
      </Card>
    );
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
