import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";

const PodMetricsTable = ({ podMetrics }) => {
    return (
        <TableContainer
            sx={{
                width: "100%",
                maxHeight: 410,
                display: "flex",
                justifyContent: "center",
                background: "transparent",
            }}
        >
            <Table stickyHeader sx={{ maxWidth: 650 }} size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>(index)</TableCell>
                        <TableCell align="right">Pod Name</TableCell>
                        <TableCell align="right">CPU (cores)</TableCell>
                        <TableCell align="right">Memory (bytes)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {podMetrics?.map((pod, index) => (
                        <TableRow
                            key={pod.name}
                            sx={{
                                "&:last-child td, &:last-child th": {
                                    border: 0,
                                },
                            }}
                        >
                            <TableCell>{index}</TableCell>
                            <TableCell align="right">{pod.name}</TableCell>
                            <TableCell align="right">{pod.cpu}</TableCell>
                            <TableCell align="right">{pod.memory}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PodMetricsTable;
