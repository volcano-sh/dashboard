import React, { useState, useEffect, useCallback } from "react";
// import { debounce } from "lodash"; // 确保安装并导入lodash
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  useTheme,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Pagination,
  Autocomplete,
  Menu,
} from "@mui/material";
import {
  Work,
  Error,
  Refresh,
  Search,
  FilterList,
  ArrowDownward,
  ArrowUpward,
} from "@mui/icons-material";
import axios from "axios";
import yaml from "js-yaml";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [namespaceFilter, setNamespaceFilter] = useState("All");
  const [selectedJobYaml, setSelectedJobYaml] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [namespaceAnchorEl, setNamespaceAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const theme = useTheme();
  const [queueFilter, setQueueFilter] = useState("All");
  const [queueAnchorEl, setQueueAnchorEl] = useState(null);
  const [selectedJobName, setSelectedJobName] = useState("");
  // const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalJobs, setTotalJobs] = useState(0);
  const [sortDirection, setSortDirection] = useState("desc");

  const fetchJobs = useCallback(
    async (currentPage, currentRowsPerPage) => {
      setLoading(true);
      try {
        const response = await axios.get("/api/jobs", {
          params: {
            search: searchTerm,
            page: currentPage,
            limit: currentRowsPerPage,
          },
        });
        setJobs(response.data.items);
        setTotalJobs(response.data.totalCount);
        setError(null);
      } catch (err) {
        setError("Failed to fetch jobs: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm]
  );

  useEffect(() => {
    fetchJobs(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    fetchJobs(1, rowsPerPage);
  };

  const handleRefresh = () => {
    setPage(1);
    setSearchTerm("");
    fetchJobs(1, rowsPerPage);
  };

  const handleJobClick = async (job) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/jobs/${job.metadata.namespace}/${job.metadata.name}/yaml`,
        {
          // 确保接收纯文本响应
          responseType: "text",
        }
      );

      // 直接使用返回的格式化 YAML
      setSelectedJobName(job.metadata.name);
      setSelectedJobYaml(response.data);
      setOpenDialog(true);
    } catch (err) {
      console.error("Failed to fetch job YAML:", err);
      setError("Failed to fetch job YAML: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
      .getDate()
      .toString()
      .padStart(2, "0")}/${date.getFullYear()} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" icon={<Error />}>
        {error}
      </Alert>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Failed":
        return theme.palette.error.main;
      case "Pending":
        return theme.palette.warning.main;
      case "Running":
        return theme.palette.success.main;
      case "Completed":
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const handleStatusFilterClick = (event) => {
    setStatusAnchorEl(event.currentTarget);
  };

  const handleNamespaceFilterClick = (event) => {
    setNamespaceAnchorEl(event.currentTarget);
  };

  const handleStatusFilterClose = (status) => {
    setStatusFilter(status);
    setStatusAnchorEl(null);
  };

  const handleNamespaceFilterClose = (namespace) => {
    setNamespaceFilter(namespace);
    setNamespaceAnchorEl(null);
  };

  const uniqueStatuses = [
    "All",
    ...new Set(jobs.map((job) => job.status?.state.phase).filter(Boolean)),
  ];
  const uniqueNamespaces = [
    "All",
    ...new Set(jobs.map((job) => job.metadata.namespace)),
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" icon={<Error />}>
        {error}
      </Alert>
    );
  }

  const handleQueueFilterClick = (event) => {
    setQueueAnchorEl(event.currentTarget);
  };

  const handleQueueFilterClose = (queue) => {
    setQueueFilter(queue);
    setQueueAnchorEl(null);
  };

  const filteredJobs = jobs.filter((job) => {
    const statusMatch =
      statusFilter === "All" ||
      (job.status && job.status.state.phase === statusFilter);
    const namespaceMatch =
      namespaceFilter === "All" || job.metadata.namespace === namespaceFilter;
    const queueMatch = queueFilter === "All" || job.spec.queue === queueFilter;
    return statusMatch && namespaceMatch && queueMatch;
  });

  // 在 sortedJobs 定义中使用这个状态
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const compareResult =
      new Date(b.metadata.creationTimestamp) -
      new Date(a.metadata.creationTimestamp);
    return sortDirection === "desc" ? compareResult : -compareResult;
  });

  // 添加一个切换排序方向的函数
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const uniqueQueues = [
    "All",
    ...new Set(jobs.map((job) => job.spec.queue).filter(Boolean)),
  ];

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
      <Typography variant="h4" gutterBottom align="left">
        Volcano Jobs Status
      </Typography>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* <TextField
            variant="outlined"
            size="small"
            placeholder="Search by job name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{ width: 300, mr: 1 }}
          /> */}
          <Autocomplete
            freeSolo
            options={[]}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                placeholder="Search by job name"
                inputProps={{
                  ...params.inputProps,
                  type: "text", // 确保输入类型为文本
                }}
              />
            )}
            value={searchTerm}
            onChange={(event, newValue) => setSearchTerm(newValue || "")}
            onInputChange={(event, newInputValue) =>
              setSearchTerm(newInputValue || "")
            }
            sx={{ width: 300, mr: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<Search />}
            onClick={handleSearchSubmit}
          >
            Search by Job Name
          </Button>
        </Box>
        <Button
          variant="contained"
          color="primary" // 使用 primary 颜色，通常是蓝色
          startIcon={<Refresh />}
          onClick={handleRefresh}
        >
          Refresh Job Status
        </Button>
      </Box>
      <TableContainer
        component={Paper}
        sx={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: "background.paper" }}>
                Name
              </TableCell>
              <TableCell sx={{ backgroundColor: "background.paper" }}>
                Namespace
                <Button
                  size="small"
                  startIcon={<FilterList />}
                  onClick={handleNamespaceFilterClick}
                >
                  Filter: {namespaceFilter}
                </Button>
              </TableCell>
              <TableCell>
                Queue
                <Button
                  size="small"
                  startIcon={<FilterList />}
                  onClick={handleQueueFilterClick}
                >
                  Filter: {queueFilter}
                </Button>
              </TableCell>
              {/* // 在 Creation Time 列标题中添加一个按钮来切换排序方向 */}
              <TableCell>
                Creation Time (MM/DD/YYYY HH:MM:SS)
                <Button
                  size="small"
                  onClick={toggleSortDirection}
                  startIcon={
                    sortDirection === "desc" ? (
                      <ArrowDownward />
                    ) : (
                      <ArrowUpward />
                    )
                  }
                >
                  Sort
                </Button>
              </TableCell>
              <TableCell>
                Status
                <Button
                  size="small"
                  startIcon={<FilterList />}
                  onClick={handleStatusFilterClick}
                >
                  Filter: {statusFilter}
                </Button>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedJobs.map((job) => (
              <TableRow
                key={`${job.metadata.namespace}-${job.metadata.name}`}
                sx={{
                  "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                  "&:hover": { bgcolor: "action.selected" },
                  cursor: "pointer",
                }}
                onClick={() => handleJobClick(job)}
              >
                <TableCell>{job.metadata.name}</TableCell>
                <TableCell>{job.metadata.namespace}</TableCell>
                <TableCell>{job.spec.queue || "N/A"}</TableCell>
                <TableCell>
                  {formatDate(job.metadata.creationTimestamp)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={job.status ? job.status.state.phase : "Unknown"}
                    sx={{
                      bgcolor: getStatusColor(
                        job.status ? job.status.state.phase : "Unknown"
                      ),
                      color: "common.white",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Select
          value={rowsPerPage}
          onChange={handleChangeRowsPerPage}
          size="small"
        >
          <MenuItem value={5}>5 per page</MenuItem>
          <MenuItem value={10}>10 per page</MenuItem>
          <MenuItem value={20}>20 per page</MenuItem>
        </Select>
      </Box>
      <Menu
        anchorEl={statusAnchorEl}
        open={Boolean(statusAnchorEl)}
        onClose={() => setStatusAnchorEl(null)}
      >
        {uniqueStatuses.map((status) => (
          <MenuItem
            key={status}
            onClick={() => handleStatusFilterClose(status)}
            selected={status === statusFilter}
          >
            {status}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={namespaceAnchorEl}
        open={Boolean(namespaceAnchorEl)}
        onClose={() => setNamespaceAnchorEl(null)}
      >
        {uniqueNamespaces.map((namespace) => (
          <MenuItem
            key={namespace}
            onClick={() => handleNamespaceFilterClose(namespace)}
            selected={namespace === namespaceFilter}
          >
            {namespace}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={queueAnchorEl}
        open={Boolean(queueAnchorEl)}
        onClose={() => setQueueAnchorEl(null)}
      >
        {uniqueQueues.map((queue) => (
          <MenuItem
            key={queue}
            onClick={() => handleQueueFilterClose(queue)}
            selected={queue === queueFilter}
          >
            {queue}
          </MenuItem>
        ))}
      </Menu>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
        <Pagination
          count={Math.ceil(totalJobs / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          color="primary"
          disabled={loading}
        />
      </Box>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: "80%",
            maxWidth: "800px",
            maxHeight: "90vh",
            m: 2,
            bgcolor: "background.paper",
          },
        }}
      >
        <DialogTitle>Job YAML - {selectedJobName}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              bgcolor: "#f5f5f5",
              p: 2,
              borderRadius: 1,
              overflow: "auto",
              maxHeight: "calc(90vh - 200px)",
            }}
          >
            <pre
              style={{
                margin: 0,
                fontFamily: "'Fira Code', monospace",
                fontSize: "14px",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedJobYaml &&
                selectedJobYaml.split("\n").map((line, index) => {
                  const keyMatch = line.match(/^(\s*)([^:\s]+):/);
                  if (keyMatch) {
                    const [, indent, key] = keyMatch;
                    const value = line.slice(keyMatch[0].length);
                    return (
                      <div key={index}>
                        <span style={{ color: "#999" }}>{indent}</span>
                        <span style={{ fontWeight: "bold", color: "#000" }}>
                          {key}
                        </span>
                        <span>{value}</span>
                      </div>
                    );
                  }
                  return <div key={index}>{line}</div>;
                })}
            </pre>
          </Box>
        </DialogContent>
        <DialogActions>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 2,
              width: "100%",
              px: 2,
              pb: 2,
            }}
          >
            <Button
              variant="contained"
              color="primary" // 使用主题中定义的 primary 颜色
              onClick={handleCloseDialog}
              sx={{
                minWidth: "100px",
                "&:hover": {
                  bgcolor: "primary.dark", // 使用主题中定义的深色变体
                },
              }}
            >
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default Jobs;
