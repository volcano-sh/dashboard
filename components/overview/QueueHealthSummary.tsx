import DonutBreakdown from "./DonutBreakdown";
import { OverviewPanel, OverviewSectionHeader } from "./OverviewPanel";

const QueueHealthSummary = ({ items }) => {
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <OverviewPanel sx={{ minHeight: 250 }}>
            <OverviewSectionHeader
                title="Queue Health Distribution"
                subtitle="Queues by health status"
            />
            <DonutBreakdown
                centerLabel="Total"
                centerValue={total}
                segments={items}
                unitLabel="queues"
            />
        </OverviewPanel>
    );
};

export default QueueHealthSummary;
