import React from "react";
import { Box } from "@mui/material";
import SchedulingTableFilters from "../scheduling/SchedulingTableFilters";
import PodSelectionList from "./PodSelectionList";
import PodsPagination from "./PodsPagination";
import PodDetailsPanel from "./PodDetailsPanel";

const PodsDetailWorkspace = ({
    namespaceFilterFields,
    onCloseDetails,
    onPaginationChange,
    onPodClick,
    onSortDirectionToggle,
    pagination,
    pods,
    selectedPod,
    selectedTab,
    setSelectedTab,
    sortDirection,
    totalPods,
}) => {
    const detailLeftOffset = {
        xs: 56,
        sm: 220,
        md: 360,
        lg: 520,
    };

    return (
        <Box
            sx={{
                minHeight: 1040,
                mt: 0,
                position: "relative",
            }}
        >
            <Box
                sx={{
                    maxWidth: 236,
                    position: "relative",
                    width: "100%",
                    zIndex: 1,
                }}
            >
                <Box sx={{ maxWidth: 160 }}>
                    <SchedulingTableFilters fields={namespaceFilterFields} />
                </Box>

                <Box sx={{ mt: 2.25 }}>
                    <PodSelectionList
                        pods={pods}
                        selectedPod={selectedPod}
                        sortDirection={sortDirection}
                        onPodClick={onPodClick}
                        onSortDirectionToggle={onSortDirectionToggle}
                    />
                </Box>

                <PodsPagination
                    compact
                    totalPods={totalPods}
                    pagination={pagination}
                    onPaginationChange={onPaginationChange}
                />
            </Box>

            <Box
                aria-hidden="true"
                sx={{
                    bgcolor: "rgba(17, 24, 39, 0.26)",
                    bottom: 0,
                    display: "block",
                    left: 0,
                    pointerEvents: "none",
                    position: "fixed",
                    right: 0,
                    top: 0,
                    zIndex: 1290,
                }}
            />

            <Box
                sx={{
                    bottom: 0,
                    left: detailLeftOffset,
                    position: "fixed",
                    right: 0,
                    top: 0,
                    width: {
                        xs: `calc(100vw - ${detailLeftOffset.xs}px)`,
                        sm: `calc(100vw - ${detailLeftOffset.sm}px)`,
                        md: `calc(100vw - ${detailLeftOffset.md}px)`,
                        lg: `calc(100vw - ${detailLeftOffset.lg}px)`,
                    },
                    zIndex: 1300,
                }}
            >
                <PodDetailsPanel
                    elevated
                    onClose={onCloseDetails}
                    selectedPod={selectedPod}
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                />
            </Box>
        </Box>
    );
};

export default PodsDetailWorkspace;
