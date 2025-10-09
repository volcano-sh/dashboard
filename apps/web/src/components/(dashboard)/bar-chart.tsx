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
  cpu: string
  memory: string
  pods: string
  cpuCapability: string
  memoryCapability: string
  podsCapability: string
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

  const parseResourceValue = (value: string): number => {
    if (!value || value === "0") return 0;

    if (value.endsWith('m')) {
      return parseInt(value) / 1000;
    }

    if (value.endsWith('Gi')) {
      return parseFloat(value);
    }
    if (value.endsWith('Mi')) {
      return parseFloat(value) / 1024;
    }
    if (value.endsWith('Ki')) {
      return parseFloat(value) / (1024 * 1024);
    }

    return parseFloat(value) || 0;
  };

  // Transform API data to match the expected format
  const transformedData = useMemo(() => {
    return data.map(queue => ({
      metadata: { name: queue.name },
      status: {
        allocated: {
          cpu: parseResourceValue(queue.cpu),
          memory: parseResourceValue(queue.memory),
          pods: parseResourceValue(queue.pods),
        },
      },
      spec: {
        capability: {
          cpu: parseResourceValue(queue.cpuCapability),
          memory: parseResourceValue(queue.memoryCapability),
          pods: parseResourceValue(queue.podsCapability),
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

  const processedData = useMemo(() => {
    return transformedData.reduce(
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
      {} as Record<string, { allocated: Record<string, unknown>; capability: Record<string, unknown> }>,
    )
  }, [transformedData])

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
