"use client"

import { Loader2Icon } from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { Skeleton } from "../ui/skeleton"

const chartConfig = {} satisfies ChartConfig

interface ChartData {
    name: string
    value: number
    fill: string
}

interface JobStatusPieChartProps {
    data?: { name: string; value: number }[]
    isLoading?: boolean
}

// Color mapping for different job statuses
const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
        case 'completed':
        case 'succeeded':
            return "#22c55e"
        case 'running':
        case 'pending':
        case 'inqueue':
            return "#38bdf8"
        case 'failed':
        case 'error':
            return "#e11d48"
        case 'unknown':
            return "#6b7280"
        default:
            return "#8b5cf6"
    }
}

const PieChartSkeleton = () => (
    <Card className="w-full p-4 h-full">
        <CardHeader className="items-center pb-0">
            <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="flex flex-col 2xl:flex-row flex-1 pb-0">
            <div className="w-full 2xl:w-3/4 h-[200px] lg:h-[300px] 2xl:h-[400px] mb-4 lg:mb-0">
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center space-y-2">
                        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Loading job status...</p>
                    </div>
                </div>
            </div>
            <div className="w-full 2xl:w-1/2 flex flex-col justify-center space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center">
                        <Skeleton className="w-3 h-3 mr-3 rounded-full" />
                        <div className="flex flex-col sm:flex-row sm:justify-between text-sm w-full">
                            <Skeleton className="h-4 w-16 mb-1 sm:mb-0" />
                            <Skeleton className="h-4 w-8" />
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

export default function JobStatusPieChart({ data = [], isLoading = false }: JobStatusPieChartProps) {
    // Transform API data to chart format
    const chartData: ChartData[] = data.map(item => ({
        name: item.name,
        value: item.value,
        fill: getStatusColor(item.name)
    }));

    const totalJobs = chartData.reduce((sum, item) => sum + item.value, 0);

    if (isLoading) {
        return <PieChartSkeleton />;
    }

    if (chartData.length === 0) {
        return (
            <Card className="w-full p-4 h-full">
                <CardHeader className="items-center pb-0">
                    <CardTitle className="text-xl text-center">
                        Jobs Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                        <p className="text-muted-foreground">No job data available</p>
                        <p className="text-sm text-muted-foreground">Create a job to see status information</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full p-4 h-full">
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-xl text-center">
                    Jobs Status
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col 2xl:flex-row flex-1 pb-0">
                <div className="w-full 2xl:w-3/4 h-[200px] lg:h-[300px] 2xl:h-[400px] mb-4 lg:mb-0">
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square h-full p-4"
                    >
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="80%"
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry: ChartData, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl text-muted-foreground">{totalJobs}</text>
                        </PieChart>
                    </ChartContainer>
                </div>
                <div className="w-full 2xl:w-1/2 flex flex-col justify-center">
                    {chartData.map((entry: ChartData, index: number) => (
                        <div key={index} className="flex items-center mb-3">
                            <div
                                className="w-3 h-3 mr-3 rounded-full"
                                style={{ backgroundColor: entry.fill }}
                                aria-hidden="true"
                            />
                            <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-muted-foreground w-full">
                                <span className="mr-2 mb-1 sm:mb-0">{entry.name}</span>
                                <span className="font-medium">
                                    {Math.abs(entry.value).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

    )
}