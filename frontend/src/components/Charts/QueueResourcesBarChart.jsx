import React, { useMemo, useState } from 'react';
import { Box, Typography, FormControl, Select, MenuItem } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import './chartConfig';

const QueueResourcesBarChart = ({ data }) => {
  const [selectedResource, setSelectedResource] = useState('cpu');

  // 定义资源类型选项
  const resourceOptions = [
    { value: 'cpu', label: 'CPU Resources' },
    { value: 'memory', label: 'Memory Resources' },
    { value: 'pods', label: 'Pods Resources' },
    { value: 'nvidia.com/gpu', label: 'GPU Resources' }
  ];

  // 处理内存单位转换
  const convertMemoryToMi = (memoryStr) => {
    if (!memoryStr) return 0;
    if (typeof memoryStr === 'number') return memoryStr;
    
    const value = parseInt(memoryStr);
    if (memoryStr.includes('Gi')) {
      return value * 1024;
    } else if (memoryStr.includes('Mi')) {
      return value;
    } else if (memoryStr.includes('Ki')) {
      return value / 1024;
    }
    return value;
  };

  // 处理队列数据
  const processedData = useMemo(() => {
    return data.reduce((acc, queue) => {
      const name = queue.metadata.name;
      const allocated = queue.status?.allocated || {};
      const guaranteed = queue.spec?.capability || {};

      // 处理内存单位转换
      const allocatedMemory = convertMemoryToMi(allocated.memory);
      const guaranteedMemory = convertMemoryToMi(guaranteed.memory);

      // 只有当队列有分配或保证的资源时才添加
      if (
        allocated[selectedResource] > 0 || 
        guaranteed[selectedResource] > 0 ||
        (selectedResource === 'memory' && (allocatedMemory > 0 || guaranteedMemory > 0))
      ) {
        acc[name] = {
          allocated: {
            ...allocated,
            memory: allocatedMemory
          },
          guaranteed: {
            ...guaranteed,
            memory: guaranteedMemory
          }
        };
      }

      return acc;
    }, {});
  }, [data, selectedResource]);

  const chartData = {
    labels: Object.keys(processedData),
    datasets: [
      {
        label: `Allocated ${selectedResource.toUpperCase()}`,
        data: Object.values(processedData).map(q => 
          selectedResource === 'memory' ? 
          q.allocated.memory || 0 : 
          q.allocated[selectedResource] || 0
        ),
        backgroundColor: '#2196f3',
        borderColor: '#1976d2',
        borderWidth: 1
      },
      {
        label: `Guaranteed ${selectedResource.toUpperCase()}`,
        data: Object.values(processedData).map(q => 
          selectedResource === 'memory' ? 
          q.guaranteed.memory || 0 : 
          q.guaranteed[selectedResource] || 0
        ),
        backgroundColor: '#4caf50',
        borderColor: '#388e3c',
        borderWidth: 1
      }
    ]
  };

  // 获取Y轴标签
  const getYAxisLabel = () => {
    switch(selectedResource) {
      case 'memory':
        return 'Memory (Mi)';
      case 'cpu':
        return 'CPU Cores';
      case 'pods':
        return 'Pod Count';
      case 'nvidia.com/gpu':
        return 'GPU Count';
      default:
        return 'Amount';
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
          font: {
            size: 10
          }
        },
        grid: {
          display: false
        }
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
          font: {
            size: 11
          }
        }
      }
    },
    layout: {
      padding: {
        bottom: 20
      }
    }
  };

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6">
          Queue Resources
        </Typography>
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
      
      <Box sx={{ 
        flex: 1,
        minHeight: 0,
        height: 'calc(100% - 100px)'
      }}>
        {Object.keys(processedData).length > 0 ? (
          <Bar 
            data={chartData} 
            options={options}
            style={{ maxHeight: '100%' }}
          />
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
