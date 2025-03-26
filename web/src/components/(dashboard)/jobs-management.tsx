'use client'

import { useState } from "react"
import { columns } from "./columns"
import { DataTable } from "./data-table"

export type JobStatus = {
    name: string;
    namespace: string;
    queue: string;
    createdAt: Date;
    status: string;
}

const sampleJobs: JobStatus[] = [
    {
      name: "Job-1",
      namespace: "default",
      queue: "high-priority",
      createdAt: new Date("2024-02-01T10:00:00Z"),
      status: "running",
    },
    {
      name: "Job-2",
      namespace: "backend",
      queue: "low-priority",
      createdAt: new Date("2024-02-02T12:30:00Z"),
      status: "pending",
    },
    {
      name: "Job-3",
      namespace: "frontend",
      queue: "medium-priority",
      createdAt: new Date("2024-02-03T14:45:00Z"),
      status: "completed",
    },
    {
      name: "Job-4",
      namespace: "analytics",
      queue: "high-priority",
      createdAt: new Date("2024-02-04T16:20:00Z"),
      status: "failed",
    },
    {
      name: "Job-5",
      namespace: "default",
      queue: "low-priority",
      createdAt: new Date("2024-02-05T08:10:00Z"),
      status: "running",
    },
  ];
  

export default function JobsManagement() {
    const [jobs, setJobs] = useState<JobStatus[]>(sampleJobs)
    return (
        <div className="container mx-auto p-4 mt-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Jobs Status</h1>
            </div>
            <DataTable columns={columns} data={jobs || []} />
        </div>
    )
}
