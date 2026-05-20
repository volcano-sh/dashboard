import { Box, Button, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { OverviewPanel, OverviewSectionHeader } from "./OverviewPanel";
import OverviewStatusChip from "./OverviewStatusChip";

const CurrentSignals = ({ signals }) => (
    <OverviewPanel>
        <OverviewSectionHeader
            title="Current Signals"
            action={
                <Button
                    endIcon={<ChevronRightIcon sx={{ fontSize: 16 }} />}
                    size="small"
                    sx={{ textTransform: "none" }}
                >
                    View all queues
                </Button>
            }
        />
        <Box sx={{ display: "grid", gap: 1.1 }}>
            {signals.map((signal) => (
                <Box
                    key={signal.message}
                    sx={{
                        alignItems: "center",
                        display: "grid",
                        gap: 1.5,
                        gridTemplateColumns: "1fr 86px",
                    }}
                >
                    <Typography sx={{ fontSize: 13 }}>
                        {signal.message}
                    </Typography>
                    <OverviewStatusChip label={signal.severity} />
                </Box>
            ))}
        </Box>
    </OverviewPanel>
);

export default CurrentSignals;
