"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
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

const CHART_HEIGHT_PX = 300

function BarChartSkeleton() {
  const t = useTranslations("dashboard")

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-[180px]" />
      </CardHeader>
      <CardContent className="flex items-center justify-center p-6 pt-0" style={{ height: CHART_HEIGHT_PX }}>
        <div className="flex flex-col items-center space-y-2">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">{t("barChart.loading")}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const QueueResourcesBarChart = ({ data = [], isLoading = false }: QueueResourcesBarChartProps) => {
  const t = useTranslations("dashboard")
  const [selectedResource, setSelectedResource] = useState("")

  const parseResourceValue = (value: string | number | undefined): number => {
    if (value === undefined || value === null || value === "") return 0
    const str = String(value).trim()
    if (str === "0") return 0

    if (str.endsWith("m")) {
      return Number.parseFloat(str.slice(0, -1)) / 1000
    }

    if (/Gi$/i.test(str)) {
      return Number.parseFloat(str)
    }
    if (/Mi$/i.test(str)) {
      return Number.parseFloat(str) / 1024
    }
    if (/Ki$/i.test(str)) {
      return Number.parseFloat(str) / (1024 * 1024)
    }

    const n = Number.parseFloat(str)
    return Number.isFinite(n) ? n : 0
  };

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
    }))
  }, [data])

  const resourceOptions = useMemo(() => {
    if (!transformedData || transformedData.length === 0) return []

    const resourceTypes = new Set<string>()

    transformedData.forEach((queue) => {
      const allocated = queue.status?.allocated || {}
      const capability = queue.spec?.capability || {}
      Object.keys(allocated).forEach((resource) => resourceTypes.add(resource))
      Object.keys(capability).forEach((resource) => resourceTypes.add(resource))
    })

    return Array.from(resourceTypes).map((resource) => {
      const label =
        resource === "nvidia.com/gpu"
          ? "GPU"
          : resource.charAt(0).toUpperCase() + resource.slice(1)
      return {
        value: resource,
        label: t("barChart.resourceLabel", { resource: label }),
      }
    })
  }, [transformedData, t])

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
        return t("barChart.axis.memory")
      case "cpu":
        return t("barChart.axis.cpu")
      case "pods":
        return t("barChart.axis.pods")
      case "nvidia.com/gpu":
        return t("barChart.axis.gpu")
      default:
        return t("barChart.axis.amount")
    }
  }

  const resourceLabel =
    selectedResource === "nvidia.com/gpu"
      ? "GPU"
      : selectedResource.charAt(0).toUpperCase() + selectedResource.slice(1)

  const chartConfig = {
    allocated: {
      label: "Allocated",
      color: "hsl(var(--chart-1))",
    },
    capacity: {
      label: "Capability",
      color: "hsl(var(--chart-2))",
    },
  }

  if (isLoading) {
    return <BarChartSkeleton />
  }

  if (transformedData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t("barChart.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6 pt-0" style={{ height: CHART_HEIGHT_PX }}>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-muted-foreground">{t("barChart.noData")}</p>
            <p className="text-sm text-muted-foreground">{t("barChart.noDataHint")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{t("barChart.title")}</CardTitle>
        <Select value={selectedResource} onValueChange={setSelectedResource}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("barChart.selectResource")} />
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
      <CardContent className="p-6 pt-0">
        {chartData.length > 0 && selectedResource ? (
          <div className="w-full" style={{ height: CHART_HEIGHT_PX }}>
            <ChartContainer
              config={chartConfig}
              className="h-full w-full !aspect-auto [&_.recharts-responsive-container]:!h-full"
            >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 16,
                right: 24,
                left: 8,
                bottom: 4,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={56}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={selectedResource !== "pods"}
                domain={[0, "auto"]}
                label={{
                  value: getYAxisLabel(),
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <Bar
                dataKey="allocated"
                fill="var(--color-allocated)"
                radius={[4, 4, 0, 0]}
                minPointSize={2}
              />
              <Bar
                dataKey="capacity"
                fill="var(--color-capacity)"
                radius={[4, 4, 0, 0]}
                minPointSize={2}
              />
            </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{ height: CHART_HEIGHT_PX }}
          >
            <p className="text-muted-foreground">{t("barChart.noDataForResource")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QueueResourcesBarChart
