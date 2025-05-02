'use client'
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {Alert, AlertTitle, AlertDescription} from "@/components/ui/alert";
import { RocketIcon } from "lucide-react";
import JobStatusPieChart from "./pie-chart";

const categories = {
    "Total Jobs": 100,
    "Active Jobs": 50,
    "Running Pods": 20,
    "Complete Rate": "50%",
}

const DashboardCard = ({ title, value }: any) => {
    return (
      <Card className="flex flex-row items-center justify-between border rounded-lg p-2 cursor-pointer" >
        <CardHeader>
          <CardTitle className="text-xl font-medium text-gray-500">{title}</CardTitle>
          <h3 className={`font-bold text-3xl break-words`}>
            {value}
          </h3>
        </CardHeader>
      </Card>
    );
  };

export const DashboardUtils = () => {
    return (
        <div className="mt-4 mx-4">
            <Alert className="mt-2 max-w-md">
            <RocketIcon className="h-4 w-4 text-purple" />
            <AlertTitle className="text-purple">Heads up!</AlertTitle>
            <AlertDescription className="text-muted-foreground">
                Jobs are running in the background. You can continue to work while we process your data.
            </AlertDescription>
            </Alert>
            <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-4">
            {Object?.entries(categories).map(([title, value], index) => (
                <DashboardCard
                key={index}
                title={title}
                value={value}
                />
            ))}
            </section>
            <section className="grid gap-2 grid-col-1 md:grid-cols-2 mt-4 w-full">
                <JobStatusPieChart />
            </section>
        </div>

    )
}