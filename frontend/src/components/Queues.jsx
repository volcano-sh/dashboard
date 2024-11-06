import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  TableSortLabel,
  IconButton,
  Menu,
  Chip,
  Modal,
  Pagination,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Refresh,
  Search,
  Clear,
  FilterList,
  FilterList as FilterListIcon,
  ArrowUpward,
  ArrowDownward,
  UnfoldMore,
  Clear as ClearIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import SearchField from "./SearchField";
import React, { useState, useEffect, useMemo } from "react";
import yaml from "js-yaml";

const Queues = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalQueues, setTotalQueues] = useState(0);
  const [queues, setQueues] = useState([]);
  const [filteredQueues, setFilteredQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentFilter, setCurrentFilter] = useState("");
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [queueYaml, setQueueYaml] = useState("");
  const [modalTitle, setModalTitle] = useState("Queue YAML");
  const [filters, setFilters] = useState({
    name: "",
    allocatedCPU: "",
    allocatedMemory: "",
    guaranteedCPU: "",
    guaranteedMemory: "",
    creationTime: "",
    state: "",
  });
  const [sortDirection, setSortDirection] = useState("desc");
  const [statusColumns, setStatusColumns] = useState([]);
  const [allocatedFields, setAllocatedFields] = useState([]);

  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: "asc",
  });

  // 处理分页
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  // 计算当前页的数据
  const paginatedQueues = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredQueues.slice(start, start + rowsPerPage);
  }, [filteredQueues, page, rowsPerPage]);

  // 处理排序
  // const handleSort = (field) => {
  //   setSortConfig((prevConfig) => ({
  //     field,
  //     direction:
  //       prevConfig.field === field && prevConfig.direction === "asc"
  //         ? "desc"
  //         : "asc",
  //   }));
  // };

  useEffect(() => {
    let sortedData = [...queues];

    if (sortConfig.field) {
      sortedData.sort((a, b) => {
        let aValue, bValue;

        // 根据不同字段获取对应的值
        switch (sortConfig.field) {
          case "cpu":
            aValue = Number(a.status?.allocated?.cpu) || 0;
            bValue = Number(b.status?.allocated?.cpu) || 0;
            break;
          case "memory":
            aValue = Number(a.status?.allocated?.memory) || 0;
            bValue = Number(b.status?.allocated?.memory) || 0;
            break;
          case "pod":
            aValue = a.metadata.name === "default" ? 1 : 0;
            bValue = b.metadata.name === "default" ? 1 : 0;
            break;
          case "creationTime":
            aValue = new Date(a.metadata.creationTimestamp).getTime();
            bValue = new Date(b.metadata.creationTimestamp).getTime();
            break;
          default:
            aValue = a[sortConfig.field];
            bValue = b[sortConfig.field];
        }

        if (sortConfig.direction === "asc") {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });
    }

    setFilteredQueues(sortedData);
  }, [queues, sortConfig]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/queues");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Received queues data:", data);

        setQueues(data.items || []);
        setFilteredQueues(data.items || []);
        setTotalQueues(data.totalCount || 0);
      } catch (error) {
        console.error("Error fetching queues:", error);
        setError("Failed to fetch queues");
      } finally {
        setLoading(false);
      }
    };

    // 组件挂载时执行一次数据获取
    fetchData();
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 修改useEffect中收集字段的逻辑
  useEffect(() => {
    const fields = new Set();
    queues.forEach((queue) => {
      if (queue.status?.allocated) {
        Object.keys(queue.status.allocated).forEach((key) => {
          fields.add(key);
        });
      }
    });
    // 将Set转换为数组并排序
    setAllocatedFields(Array.from(fields).sort());
  }, [queues]);

  const fetchQueues = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/queues?page=${page}&limit=${rowsPerPage}&search=${searchText}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      setQueues(data.items || []);
      setFilteredQueues(data.items || []);
      setTotalQueues(data.totalCount || 0);

      // 确保页码正确
      const maxPage = Math.ceil((data.totalCount || 0) / rowsPerPage);
      if (page > maxPage) {
        setPage(1);
      }
    } catch (error) {
      console.error("Error fetching queues:", error);
      setError("Failed to fetch queues");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchText(event.target.value);
  };

  const clearSearch = () => {
    setSearchText("");
    setPage(1);
  };
  const handleFilterClick = (event, field) => {
    setAnchorEl(event.currentTarget);
    setCurrentFilter(field);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterSelect = (value) => {
    const newFilters = { ...filters, [currentFilter]: value };
    setFilters(newFilters);
    applyFilters(searchText, newFilters);
    handleFilterClose();
  };

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

  const applyFilters = (search, currentFilters) => {
    let filtered = queues.filter(
      (queue) =>
        queue.metadata.name.toLowerCase().includes(search.toLowerCase()) &&
        (currentFilters.namespace === "" ||
          queue.metadata.namespace === currentFilters.namespace) &&
        (currentFilters.state === "" ||
          queue.status?.state === currentFilters.state)
    );
    setFilteredQueues(filtered);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedQueues = useMemo(() => {
    let sorted = [...queues];
    if (sortConfig.field) {
      sorted.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.field) {
          case "cpu":
            aValue = Number(a.status?.allocated?.cpu) || 0;
            bValue = Number(b.status?.allocated?.cpu) || 0;
            break;
          case "memory":
            aValue = Number(a.status?.allocated?.memory) || 0;
            bValue = Number(b.status?.allocated?.memory) || 0;
            break;
          case "pod":
            aValue = a.metadata.name === "default" ? 1 : 0;
            bValue = b.metadata.name === "default" ? 1 : 0;
            break;
          case "creationTime":
            aValue = new Date(a.metadata.creationTimestamp).getTime();
            bValue = new Date(b.metadata.creationTimestamp).getTime();
            break;
          default:
            aValue = a[sortConfig.field];
            bValue = b[sortConfig.field];
        }

        if (sortConfig.direction === "asc") {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });
    }
    return sorted;
  }, [queues, sortConfig]);

  // 修改处理队列点击的函数
  const handleQueueClick = (queue) => {
    try {
      const queueName = queue.metadata?.name || "Unknown Queue";
      setModalTitle(`Queue YAML - ${queueName}`);

      // 使用 js-yaml 生成格式化的 YAML
      const yamlText = yaml.dump(queue, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      });

      // 修改这里：不再使用星号，直接用 span 标签包裹键名
      const formattedYaml = yamlText
        .split("\n")
        .map((line, index) => {
          const keyMatch = line.match(/^(\s*)([^:\s]+):/);
          if (keyMatch) {
            const [, indent, key] = keyMatch;
            const value = line.slice(keyMatch[0].length);
            return `${indent}<span class="yaml-key">${key}</span>:${value}`;
          }
          return line;
        })
        .join("\n");

      setQueueYaml(formattedYaml);
      setSelectedQueue(queue);
      setModalOpen(true);
    } catch (error) {
      console.error("Error generating queue YAML:", error);
    }
  };

  // 定义基础列
  const getColumns = () => [
    {
      field: "name",
      headerName: "Name",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography>Name</Typography>
        </Box>
      ),
    },
    // 动态状态列
    ...statusColumns.map((key) => ({
      field: key,
      headerName: `Status ${key}`,
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>{`Status ${key}`}</Typography>
          <Button
            size="small"
            startIcon={<FilterList />}
            onClick={(event) => handleFilterClick(event, key)}
          >
            Filter: {filters[key] || "ALL"}
          </Button>
        </Box>
      ),
    })),
    {
      field: "guaranteedCPU",
      headerName: "Guaranteed CPU",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Guaranteed CPU</Typography>
          <Button
            size="small"
            startIcon={<FilterList />}
            onClick={(event) => handleFilterClick(event, "guaranteedCPU")}
          >
            Filter: {filters.guaranteedCPU || "ALL"}
          </Button>
        </Box>
      ),
    },
    {
      field: "guaranteedMemory",
      headerName: "Guaranteed Memory",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Guaranteed Memory</Typography>
          <Button
            size="small"
            startIcon={<FilterList />}
            onClick={(event) => handleFilterClick(event, "guaranteedMemory")}
          >
            Filter: {filters.guaranteedMemory || "ALL"}
          </Button>
        </Box>
      ),
    },
    {
      field: "creationTime",
      headerName: "Creation Time (MM/DD/YYYY HH:MM:SS)",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Creation Time (MM/DD/YYYY HH:MM:SS)</Typography>
          <Button
            size="small"
            onClick={toggleSortDirection}
            startIcon={
              sortDirection === "desc" ? <ArrowDownward /> : <ArrowUpward />
            }
          >
            Sort
          </Button>
        </Box>
      ),
    },
    {
      field: "state",
      headerName: "State",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>State</Typography>
          <Button
            size="small"
            startIcon={<FilterList />}
            onClick={(event) => handleFilterClick(event, "state")}
          >
            Filter: {filters.state || "ALL"}
          </Button>
        </Box>
      ),
    },
  ];

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const columns = [
    {
      field: "name",
      headerName: "Name",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Name</Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Button
              size="small"
              sx={{ ml: 1, textTransform: "none" }}
              endIcon={<FilterListIcon />}
            >
              FILTER: {filters.name || "ALL"}
            </Button>
          </Box>
        </Box>
      ),
    },
    {
      field: "allocatedCPU",
      headerName: "Allocated CPU",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Allocated CPU</Typography>
          <Button
            size="small"
            sx={{ ml: 1, textTransform: "none" }}
            endIcon={<FilterListIcon />}
          >
            FILTER: {filters.allocatedCPU || "ALL"}
          </Button>
        </Box>
      ),
    },
    {
      field: "allocatedMemory",
      headerName: "Allocated Memory",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Allocated Memory</Typography>
          <Button
            size="small"
            sx={{ ml: 1, textTransform: "none" }}
            endIcon={<FilterListIcon />}
          >
            FILTER: {filters.allocatedMemory || "ALL"}
          </Button>
        </Box>
      ),
    },
    {
      field: "guaranteedCPU",
      headerName: "Guaranteed CPU",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Guaranteed CPU</Typography>
          <Button
            size="small"
            sx={{ ml: 1, textTransform: "none" }}
            endIcon={<FilterListIcon />}
          >
            FILTER: {filters.guaranteedCPU || "ALL"}
          </Button>
        </Box>
      ),
    },
    {
      field: "guaranteedMemory",
      headerName: "Guaranteed Memory",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Guaranteed Memory</Typography>
          <Button
            size="small"
            sx={{ ml: 1, textTransform: "none" }}
            endIcon={<FilterListIcon />}
          >
            FILTER: {filters.guaranteedMemory || "ALL"}
          </Button>
        </Box>
      ),
    },
    {
      field: "creationTime",
      headerName: "Creation Time",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Creation Time</Typography>
          <Button
            size="small"
            sx={{ ml: 1, textTransform: "none" }}
            endIcon={<FilterListIcon />}
          >
            FILTER: {filters.creationTime || "ALL"}
          </Button>
        </Box>
      ),
    },
    {
      field: "state",
      headerName: "State",
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>State</Typography>
          <Button
            size="small"
            sx={{ ml: 1, textTransform: "none" }}
            endIcon={<FilterListIcon />}
          >
            FILTER: {filters.state || "ALL"}
          </Button>
        </Box>
      ),
    },
  ];

  const fetchQueueYaml = async (queue) => {
    try {
      // 将队列对象转换为 YAML 字符串
      const yamlString = yaml.dump(queue, {
        styles: {
          "!!null": "canonical", // 保留空值
        },
        sortKeys: true, // 按字母顺序排序键
        lineWidth: -1, // 不限制行宽
      });

      // 为所有键添加粗体
      const formattedYaml = yamlString.replace(/^([^:\n]+):/gm, "**$1:**");

      setQueueYaml(formattedYaml);
    } catch (error) {
      console.error("Error generating YAML:", error);
      setQueueYaml("Error generating YAML");
    }
  };

  const SortOptions = ({ sortConfig, onSortChange }) => {
    const sortableColumns = [
      { key: "allocatedCPU", label: "Allocated CPU" },
      { key: "allocatedMemory", label: "Allocated Memory" },
      { key: "guaranteedCPU", label: "Guaranteed CPU" },
      { key: "guaranteedMemory", label: "Guaranteed Memory" },
      { key: "creationTimestamp", label: "Creation Time" },
    ];
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        {sortableColumns.map((column) => (
          <Button
            key={column.key}
            onClick={() => onSortChange(column.key)}
            startIcon={
              sortConfig.key === column.key ? (
                sortConfig.direction === "asc" ? (
                  <ArrowUpward />
                ) : (
                  <ArrowDownward />
                )
              ) : null
            }
          >
            {column.label}
          </Button>
        ))}
      </Box>
    );
  };

  // 修改排序逻辑以支持allocated字段
  const handleSort = (field) => {
    setSortConfig((prevConfig) => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // 修改排序实现
  useEffect(() => {
    let sortedData = [...queues];
    if (sortConfig.field) {
      sortedData.sort((a, b) => {
        let aValue, bValue;

        // 处理allocated字段的排序
        if (allocatedFields.includes(sortConfig.field)) {
          aValue = Number(a.status?.allocated?.[sortConfig.field]) || 0;
          bValue = Number(b.status?.allocated?.[sortConfig.field]) || 0;
        } else {
          // 处理其他字段的排序
          switch (sortConfig.field) {
            case "name":
              aValue = a.metadata.name;
              bValue = b.metadata.name;
              break;
            case "namespace":
              aValue = a.metadata.namespace || "default";
              bValue = b.metadata.namespace || "default";
              break;
            case "creationTime":
              aValue = new Date(a.metadata.creationTimestamp).getTime();
              bValue = new Date(b.metadata.creationTimestamp).getTime();
              break;
            default:
              aValue = a[sortConfig.field];
              bValue = b[sortConfig.field];
          }
        }

        if (sortConfig.direction === "asc") {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });
    }
    setFilteredQueues(sortedData);
  }, [queues, sortConfig, allocatedFields]);

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Volcano Queues Status
      </Typography>

      {/* 搜索区域 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
          alignItems: "center",
          px: 3, // 左右padding
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", position: "relative" }}
        >
          <TextField
            placeholder="Search queues"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="small"
            sx={{
              width: 300,
              "& .MuiOutlinedInput-root": {
                paddingRight: searchText ? "40px" : "14px",
              },
            }}
            InputProps={{
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchText("")}
                    edge="end"
                    sx={{ position: "absolute", right: 8 }} // 调整位置到最右边
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={() => fetchQueues()}
            sx={{ ml: 1 }}
          >
            SEARCH BY QUEUE NAME
          </Button>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchQueues}
        >
          REFRESH QUEUE STATUS
        </Button>
      </Box>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="queue-details-modal"
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
            {modalTitle}
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
              "& .yaml-key": {
                fontWeight: 700,
                color: "#000",
              },
            }}
          >
            <pre dangerouslySetInnerHTML={{ __html: queueYaml }} />
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 2,
            }}
          >
            <Button variant="contained" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* 表格区域 */}
      <Box sx={{ mx: 3, overflow: "auto" }}>
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography>Name</Typography>
                </TableCell>
                {/* 动态渲染allocated字段列 */}
                {allocatedFields.map((field) => (
                  <TableCell key={field}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography>{`Allocated ${field}`}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleSort(field)}
                        sx={{ ml: 1 }}
                      >
                        {sortConfig.field === field ? (
                          sortConfig.direction === "asc" ? (
                            <ArrowUpward />
                          ) : (
                            <ArrowDownward />
                          )
                        ) : (
                          <UnfoldMore />
                        )}
                      </IconButton>
                    </Box>
                  </TableCell>
                ))}
                <TableCell>
                  <Typography>Creation Time</Typography>
                </TableCell>
                <TableCell>
                  <Typography>State</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={allocatedFields.length + 3}
                    align="center"
                  >
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : sortedQueues.length > 0 ? (
                sortedQueues
                  .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                  .map((queue) => (
                    <TableRow
                      hover
                      key={queue.metadata.name}
                      onClick={() => handleQueueClick(queue)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{queue.metadata.name}</TableCell>
                      {/* 动态渲染allocated字段值 */}
                      {allocatedFields.map((field) => (
                        <TableCell key={field}>
                          {queue.status?.allocated?.[field] || "0"}
                        </TableCell>
                      ))}
                      <TableCell>
                        {new Date(
                          queue.metadata.creationTimestamp
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={queue.status?.state || "N/A"}
                          color={
                            queue.status?.state === "Open"
                              ? "success"
                              : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={allocatedFields.length + 3}
                    align="center"
                  >
                    No queues found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* 分页控件 */}
      <Box
        sx={{
          mt: 2,
          px: 3, // 左右padding
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
        {/* <Typography variant="body2" color="text.secondary">
          Total: {totalQueues} queues
        </Typography> */}
        <Box sx={{ display: "flex", justifyContent: "center", flexGrow: 1 }}>
          <Pagination
            count={Math.ceil(queues.length / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            showFirstButton
            showLastButton
            siblingCount={1}
            boundaryCount={1}
          />
        </Box>
        <Box sx={{ width: 100 }}></Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleFilterSelect("")}>All</MenuItem>
        {currentFilter === "state"
          ? [
              <MenuItem key="open" onClick={() => handleFilterSelect("Open")}>
                Open
              </MenuItem>,
              <MenuItem
                key="closed"
                onClick={() => handleFilterSelect("Closed")}
              >
                Closed
              </MenuItem>,
            ]
          : null}
      </Menu>
    </Box>
  );
};
export default Queues;
