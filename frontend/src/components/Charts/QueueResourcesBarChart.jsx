import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, FormControl, Select, MenuItem } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import './chartConfig';

const QueueResourcesBarChart = ({ data }) => {
  const [selectedResource, setSelectedResource] = useState('');

  // 动态获取资源类型选项
  const resourceOptions = useMemo(() => {
    if (!data || data.length === 0) return [];

    const resourceTypes = new Set();

    // 遍历队列数据，获取所有的资源类型
    data.forEach(queue => {
      const allocated = queue.status?.allocated || {};
      Object.keys(allocated).forEach(resource => resourceTypes.add(resource));
    });

    // 将资源类型从 Set 转换为数组
    return Array.from(resourceTypes).map(resource => ({
      value: resource,
      label: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Resources`
    }));
  }, [data]);

  useEffect(() => {
    // 如果存在资源选项，默认选中第一个资源
    if (resourceOptions.length > 0 && !selectedResource) {
      setSelectedResource(resourceOptions[0].value);
    }
  }, [resourceOptions, selectedResource]);

  const convertMemoryToGi = (memoryStr) => {
    if (!memoryStr) return 0;
    const value = parseInt(memoryStr);
    if (memoryStr.includes('Gi')) return value;
    if (memoryStr.includes('Mi')) return value / 1024; // Mi 转 Gi
    if (memoryStr.includes('Ki')) return value / 1024 / 1024; // Ki 转 Gi
    return value; // 默认假设是 Gi
  };

  const convertCPUToCores = (cpuStr) => {
    if (!cpuStr) return 0;
    const value = parseInt(cpuStr);
    return cpuStr.includes('m') ? value / 1000 : value; // m 转为核心数
  };

  // 处理队列数据并转换内存、CPU 单位
  const processData = (data) => {
    return data.reduce((acc, queue) => {
      const name = queue.metadata.name;
      const allocated = queue.status?.allocated || {};
      const guaranteed = queue.spec?.capability || {};

      // 处理内存单位转换
      const allocatedMemory = convertMemoryToGi(allocated.memory);
      const guaranteedMemory = convertMemoryToGi(guaranteed.memory);

      // 处理CPU单位转换
      const allocatedCPU = convertCPUToCores(allocated.cpu);
      const guaranteedCPU = convertCPUToCores(guaranteed.cpu);

      acc[name] = {
        allocated: {
          ...allocated,
          memory: allocatedMemory,
          cpu: allocatedCPU
        },
        guaranteed: {
          ...guaranteed,
          memory: guaranteedMemory,
          cpu: guaranteedCPU
        }
      };

      return acc;
    }, {});
  };

  // 处理队列数据
  const processedData = useMemo(() => processData(data), [data]);

  // 构建图表数据
  const chartData = {
    labels: Object.keys(processedData),
    datasets: [
      {
        label: `Allocated ${selectedResource.toUpperCase()}`,
        data: Object.values(processedData).map(q => q.allocated[selectedResource] || 0
        ),
        backgroundColor: '#2196f3',
        borderColor: '#1976d2',
        borderWidth: 1
      },
      {
        label: `Guaranteed ${selectedResource.toUpperCase()}`,
        data: Object.values(processedData).map(q => q.guaranteed[selectedResource] || 0
        ),
        backgroundColor: '#4caf50',
        borderColor: '#388e3c',
        borderWidth: 1
      }
    ]
  };

  // 获取Y轴标签
  const getYAxisLabel = () => {
    switch (selectedResource) {
      case 'memory': return 'Memory (Gi)';
      case 'cpu': return 'CPU Cores';
      case 'pods': return 'Pod Count';
      case 'nvidia.com/gpu': return 'GPU Count';
      default: return 'Amount';
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
          font: { size: 10 }
        },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: getYAxisLabel()
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        align: 'start',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 11 }
        }
      }
    },
    layout: {
      padding: { bottom: 20 }
    }
  };

  return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Queue Resources</Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
            >
              {resourceOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, height: 'calc(100% - 100px)' }}>
          {Object.keys(processedData).length > 0 ? (
              <Bar data={chartData} options={options} style={{ maxHeight: '100%' }} />
          ) : (
              <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
                No data available for selected resource type
              </Typography>
          )}
        </Box>
      </Box>
  );
};

export default QueueResourcesBarChart;
