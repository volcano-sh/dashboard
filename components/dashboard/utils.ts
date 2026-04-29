export const calculateSuccessRate = (jobs) => {
    if (!jobs || jobs.length === 0) return 0;
    const completed = jobs.filter(
        (job) =>
            job.status?.succeeded || job.status?.state?.phase === "Completed",
    ).length;
    const finished = jobs.filter(
        (job) =>
            job.status?.succeeded ||
            job.status?.failed ||
            job.status?.state?.phase === "Completed" ||
            job.status?.state?.phase === "Failed",
    ).length;
    return finished === 0 ? 0 : Math.round((completed / finished) * 100);
};
