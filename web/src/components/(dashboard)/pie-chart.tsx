"use client"

import { Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart"


const chartConfig = {} satisfies ChartConfig

interface ChartData {
    name: string
    value: number
    fill: string
}

const data = [
    {
        name: "Completed",
        value: 60,
        fill: "#22c55e"
    },
    {
        name: "Running",
        value: 20,
        fill: "#38bdf8",
    },
    {
        name: "Failed",
        value: 10,
        fill: "#e11d48",
    },
]


export default function JobStatusPieChart() {
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
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="80%"
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry: ChartData, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </div>
                <div className="w-full 2xl:w-1/2 flex flex-col justify-center">
                    {data.map((entry: ChartData, index: number) => (
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