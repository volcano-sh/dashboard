import React, { useState, useEffect } from "react";
import yaml from "js-yaml";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  MenuItem,
  TableRow,
  Paper,
  Modal,
  Pagination,
  Chip,
  Menu,
  CircularProgress,
  IconButton,
  Select,
} from "@mui/material";
import {
  FilterList,
  ArrowDownward,
  ArrowUpward,
  Search,
  Clear,
  Refresh, // Changed from RefreshIcon to Refresh
} from "@mui/icons-material";

import { createTheme, ThemeProvider } from '@mui/material/styles';




const Pods = () => {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pods, setPods] = useState([]);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPods, setTotalPods] = useState(0);
  const [selectedPod, setSelectedPod] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "creationTimestamp",
    direction: "desc",
  });
  const [sortDirection, setSortDirection] = useState("desc");
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [namespaceAnchorEl, setNamespaceAnchorEl] = useState(null);
  const [queueFilter, setQueueFilter] = useState("All");
  const [queueAnchorEl, setQueueAnchorEl] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [namespaceFilter, setNamespaceFilter] = useState("All");
  const [filteredPods, setFilteredPods] = useState([]);

  const handleQueueFilterClose = (queue) => {
    setQueueFilter(queue);
    setQueueAnchorEl(null);
  };

  const handleQueueFilterClick = (event) => {
    setQueueAnchorEl(event.currentTarget);
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

  // const toggleSortDirection = () => {
  //   setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  // };

  const calculateAge = (creationTimestamp) => {
    const created = new Date(creationTimestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - created) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const columns = [
    { id: "name", label: "Name", minWidth: 170 },
    { id: "namespace", label: "Namespace", minWidth: 100, filter: true },
    { id: "status", label: "Status", minWidth: 100, filter: true },
    {
      id: "creationTimestamp",
      label: "Creation Time (MM/DD/YYYY HH:MM:SS)",
      minWidth: 200,
      sort: true,
    },
    { id: "age", label: "Age", minWidth: 100 },
  ];
  const fetchPods = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        `Fetching pods with page=${page}, limit=${rowsPerPage}, search=${searchText}`
      );
      const response = await fetch(
        `/api/pods?page=${page}&limit=${rowsPerPage}&search=${searchText}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received pods data:", data);

      setPods(data.items || []);
      setFilteredPods(data.items || []);
      setTotalPods(data.totalCount || 0);
    } catch (error) {
      console.error("Error fetching pods:", error);
      setError("Failed to fetch pods. Please try again later.");
      setPods([]);
      setFilteredPods([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPods();
  }, [page, rowsPerPage, searchText]); // 添加这些依赖项，当它们变化时重新获取数据行

  useEffect(() => {
    if (pods.length > 0) {
      // 只在 pods 有数据时执行过滤
      const filtered = pods.filter((pod) => {
        const statusMatch =
          statusFilter === "All" || pod.status.phase === statusFilter;
        const namespaceMatch =
          namespaceFilter === "All" ||
          pod.metadata.namespace === namespaceFilter;
        const queueMatch =
          queueFilter === "All" || pod.metadata.labels?.queue === queueFilter;
        return statusMatch && namespaceMatch && queueMatch;
      });
      setFilteredPods(filtered);
    }
  }, [pods, statusFilter, namespaceFilter, queueFilter]);
  const handleSearch = (event) => {
    setSearchText(event.target.value);
    setPage(1); // 重置页码
  };

  // 修改清除搜索函数
  const handleClearSearch = () => {
    setSearchText("");
    setPage(1);
    fetchPods(); // 清除搜索后重新获取数据
  };

  const handleRefresh = () => {
    fetchPods();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handlePodClick = async (pod) => {
    setSelectedPod(pod);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedPods = React.useMemo(() => {
    if (!Array.isArray(filteredPods)) return [];

    let sortableItems = [...filteredPods];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === "creationTimestamp") {
          const timeA = new Date(a.metadata.creationTimestamp).getTime();
          const timeB = new Date(b.metadata.creationTimestamp).getTime();
          return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredPods, sortConfig]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => {
      const newDirection = prev === "desc" ? "asc" : "desc";
      setSortConfig({
        key: "creationTimestamp",
        direction: newDirection,
      });
      return newDirection;
    });
  };

  const getPodStatusColor = (status) => {
    switch (status) {
      case "Running":
        return "success";
      case "Pending":
        return "warning";
      case "Failed":
        return "error";
      case "Succeeded":
        return "info";
      default:
        return "default";
    }
  };

  const uniqueStatuses = [
    "All",
    ...new Set(pods.map((pod) => pod.status.phase).filter(Boolean)),
  ];
  const uniqueNamespaces = [
    "All",
    ...new Set(pods.map((pod) => pod.metadata.namespace)),
  ];
  const uniqueQueues = [
    "All",
    ...new Set(pods.map((pod) => pod.metadata.labels?.queue).filter(Boolean)),
  ];

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Volcano Pods Status
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            placeholder="Search pods"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={handleSearch}
            InputProps={{
              endAdornment: searchText && (
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  sx={{ padding: "4px" }}
                >
                  <Clear />
                </IconButton>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => fetchPods()} // 直接调用 fetchPods
            startIcon={<Search />}
          >
            SEARCH BY POD NAME
          </Button>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Refresh />}
          onClick={handleRefresh}
        >
          REFRESH POD STATUS
        </Button>
      </Box>
      {/* 错误提示 */}
      {error && (
        <Typography color="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Typography>
      )}
      {/* 加载状态和表格内容 */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>
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
                    Status
                    <Button
                      size="small"
                      startIcon={<FilterList />}
                      onClick={handleStatusFilterClick}
                    >
                      Filter: {statusFilter}
                    </Button>
                  </TableCell>
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
                  <TableCell>Age</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPods.map((pod) => (
                  <TableRow
                    hover
                    key={pod.metadata.uid}
                    onClick={() => handlePodClick(pod)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{pod.metadata.name}</TableCell>
                    <TableCell>{pod.metadata.namespace}</TableCell>
                    <TableCell>
                      <Chip
                        label={pod.status.phase}
                        color={getPodStatusColor(pod.status.phase)}
                        sx={{
                          backgroundColor: (theme) => {
                            switch (pod.status.phase) {
                              case "Succeeded":
                                return theme.palette.info.main;
                              case "Running":
                                return theme.palette.success.main;
                              case "Failed":
                                return theme.palette.error.main;
                              case "Pending":
                                return theme.palette.warning.main;
                              default:
                                return theme.palette.grey[500];
                            }
                          },
                          color: "white",
                          "& .MuiChip-label": {
                            color: "white",
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(pod.metadata.creationTimestamp).toLocaleString(
                        "en-US",
                        {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        }
                      )}
                    </TableCell>
                    <TableCell>
                      {calculateAge(pod.metadata.creationTimestamp)}
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
            <Box
              sx={{ display: "flex", justifyContent: "center", flexGrow: 1 }}
            >
              <Pagination
                count={Math.ceil(totalPods / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
            <Box sx={{ width: 100 }}></Box>
          </Box>
        </>
      )}
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
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth={false}
        PaperProps={{
          style: { backgroundColor: "transparent", boxShadow: "none" },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: 800,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            outline: "none",
            overflow: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Pod YAML - {selectedPod?.metadata.name}
          </Typography>
          <Box
            sx={{
              mt: 2,
              mb: 2,
              fontFamily: "monospace",
              fontSize: "1.2rem",
              whiteSpace: "pre-wrap",
              overflow: "auto",
              maxHeight: "calc(90vh - 150px)",
              bgcolor: "grey.50",
              p: 2,
              borderRadius: 1,
            }}
          >
            {selectedPod && (
              <div style={{ whiteSpace: "pre-wrap" }}>
                {yaml
                  .dump(selectedPod, {
                    indent: 2,
                    lineWidth: -1,
                    noRefs: true,
                  })
                  .split("\n")
                  .map((line, index) => {
                    const keyMatch = line.match(/^(\s*)([^:\s]+):/);
                    if (keyMatch) {
                      const [, indent, key] = keyMatch;
                      const value = line.slice(keyMatch[0].length);
                      return (
                        <div key={index}>
                          {indent}
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#000",
                              display: "inline-block",
                            }}
                          >
                            {key}
                          </span>
                          :{value}
                        </div>
                      );
                    }
                    return <div key={index}>{line}</div>;
                  })}
              </div>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 2,
            }}
          >
            <Button variant="contained" onClick={handleCloseModal}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Pods;
