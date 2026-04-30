import DonutBreakdown from "./DonutBreakdown";
import { OverviewPanel, OverviewSectionHeader } from "./OverviewPanel";

const PodStatusDistribution = ({ segments }) => {
    const total = segments.reduce((sum, item) => sum + item.value, 0);

    return (
        <OverviewPanel sx={{ minHeight: 250 }}>
            <OverviewSectionHeader
                title="Pod Status Distribution"
                subtitle="Current distribution of all pods"
            />
            <DonutBreakdown
                centerLabel="Total"
                centerValue={total}
                segments={segments}
                unitLabel="pods"
            />
        </OverviewPanel>
    );
};

export default PodStatusDistribution;
