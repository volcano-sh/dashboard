import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Paper,
  Alert,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * JobForm component for editing Job resources
 */
const JobForm = ({ data, onChange, disabled = false, mode = 'create' }) => {
  const [nameError, setNameError] = useState('');
  const [namespaces, setNamespaces] = useState(['default']);
  const [queues, setQueues] = useState(['default']);
  
  // Determine if we're in edit mode
  const isEditMode = mode === 'edit';
  
  // Fetch available namespaces and queues
  useEffect(() => {
    // In a real implementation, these would be API calls
    // For now, we'll just mock some data
    setNamespaces(['default', 'kube-system', 'volcano-system']);
    setQueues(['default', 'high-priority', 'batch', 'test']);
  }, []);

  // Validate name field
  useEffect(() => {
    if (!data?.metadata?.name) {
      setNameError('Name is required');
    } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(data.metadata.name)) {
      setNameError('Name must consist of lowercase alphanumeric characters or "-", and must start and end with an alphanumeric character');
    } else {
      setNameError('');
    }
  }, [data?.metadata?.name]);

  // Deep clone to avoid direct mutation
  const updateData = (path, value) => {
    if (disabled) return;
    
    const newData = JSON.parse(JSON.stringify(data));
    const pathParts = path.split('.');
    
    // Navigate to the nested object
    let current = newData;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      
      // Handle array paths like tasks[0]
      if (part.includes('[') && part.includes(']')) {
        const arrName = part.substring(0, part.indexOf('['));
        const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')));
        
        if (!current[arrName]) current[arrName] = [];
        if (!current[arrName][index]) current[arrName][index] = {};
        
        current = current[arrName][index];
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
    
    // Set the value
    current[pathParts[pathParts.length - 1]] = value;
    onChange(newData);
  };

  // Add a new task
  const addTask = () => {
    if (disabled || isEditMode) return;
    
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData.spec) newData.spec = {};
    if (!newData.spec.tasks) newData.spec.tasks = [];
    
    newData.spec.tasks.push({
      replicas: 1,
      name: `task-${newData.spec.tasks.length + 1}`,
      template: {
        spec: {
          containers: [
            {
              name: 'container',
              image: 'nginx:latest',
              resources: {
                requests: {
                  cpu: '100m',
                  memory: '100Mi'
                },
                limits: {
                  cpu: '1000m',
                  memory: '1Gi'
                }
              }
            }
          ],
          restartPolicy: 'Never'
        }
      }
    });
    
    onChange(newData);
  };

  // Remove a task
  const removeTask = (index) => {
    if (disabled || isEditMode) return;
    
    const newData = JSON.parse(JSON.stringify(data));
    newData.spec.tasks.splice(index, 1);
    onChange(newData);
  };

  // Add a container to a task
  const addContainer = (taskIndex) => {
    if (disabled || isEditMode) return;
    
    const newData = JSON.parse(JSON.stringify(data));
    const task = newData.spec.tasks[taskIndex];
    
    if (!task.template) task.template = {};
    if (!task.template.spec) task.template.spec = {};
    if (!task.template.spec.containers) task.template.spec.containers = [];
    
    task.template.spec.containers.push({
      name: `container-${task.template.spec.containers.length + 1}`,
      image: 'nginx:latest',
      resources: {
        requests: {
          cpu: '100m',
          memory: '100Mi'
        },
        limits: {
          cpu: '1000m',
          memory: '1Gi'
        }
      }
    });
    
    onChange(newData);
  };

  // Remove a container
  const removeContainer = (taskIndex, containerIndex) => {
    if (disabled || isEditMode) return;
    
    const newData = JSON.parse(JSON.stringify(data));
    newData.spec.tasks[taskIndex].template.spec.containers.splice(containerIndex, 1);
    onChange(newData);
  };

  // Ensure default structure
  useEffect(() => {
    if (!data) return;
    
    const newData = { ...data };
    
    // Ensure required fields exist
    if (!newData.apiVersion) newData.apiVersion = 'batch.volcano.sh/v1alpha1';
    if (!newData.kind) newData.kind = 'Job';
    if (!newData.metadata) newData.metadata = {};
    if (!newData.spec) newData.spec = {};
    if (!newData.spec.tasks) newData.spec.tasks = [];
    
    // If no tasks, add a default one
    if (newData.spec.tasks.length === 0) {
      newData.spec.tasks.push({
        replicas: 1,
        name: 'default',
        template: {
          spec: {
            containers: [
              {
                name: 'container',
                image: 'nginx:latest',
                resources: {
                  requests: {
                    cpu: '100m',
                    memory: '100Mi'
                  },
                  limits: {
                    cpu: '1000m',
                    memory: '1Gi'
                  }
                }
              }
            ],
            restartPolicy: 'Never'
          }
        }
      });
    }
    
    // Set default scheduler and queue if not present
    if (!newData.spec.schedulerName) newData.spec.schedulerName = 'volcano';
    if (!newData.spec.queue) newData.spec.queue = 'default';
    if (!newData.spec.minAvailable) newData.spec.minAvailable = 1;
    
    onChange(newData);
  }, []);

  if (!data) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ mt: 1 }}>
      {/* Add warning message for edit mode */}
      {isEditMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Some fields cannot be modified after a job is created. Only the Queue field can be edited.
        </Alert>
      )}
      
      {/* Metadata Section */}
      <Typography variant="h6" gutterBottom>
        Metadata
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Name"
            fullWidth
            required
            value={data.metadata?.name || ''}
            onChange={(e) => updateData('metadata.name', e.target.value)}
            error={!!nameError}
            helperText={nameError || (isEditMode ? "Cannot be changed after creation" : "")}
            disabled={disabled || isEditMode} // Name can't be changed after creation
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={disabled || isEditMode}> {/* Namespace can't be changed */}
            <InputLabel id="namespace-label">Namespace</InputLabel>
            <Select
              labelId="namespace-label"
              value={data.metadata?.namespace || 'default'}
              label="Namespace"
              onChange={(e) => updateData('metadata.namespace', e.target.value)}
            >
              {namespaces.map((ns) => (
                <MenuItem key={ns} value={ns}>{ns}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {isEditMode && (
            <Typography variant="caption" color="text.secondary">
              Cannot be changed after creation
            </Typography>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Job Settings Section */}
      <Typography variant="h6" gutterBottom>
        Job Settings
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Minimum Available Pods"
            type="number"
            fullWidth
            value={data.spec?.minAvailable || 1}
            onChange={(e) => updateData('spec.minAvailable', parseInt(e.target.value) || 1)}
            inputProps={{ min: 1 }}
            disabled={disabled || isEditMode} // Can't change minAvailable after creation
            helperText={isEditMode ? "Cannot be changed after creation" : ""}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id="queue-label">Queue</InputLabel>
            <Select
              labelId="queue-label"
              value={data.spec?.queue || 'default'}
              label="Queue"
              onChange={(e) => updateData('spec.queue', e.target.value)}
            >
              {queues.map((queue) => (
                <MenuItem key={queue} value={queue}>{queue}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {isEditMode && (
            <Typography variant="caption" color="text.secondary" sx={{ color: 'green' }}>
              This field can be changed
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            label="Scheduler Name"
            fullWidth
            value={data.spec?.schedulerName || 'volcano'}
            onChange={(e) => updateData('spec.schedulerName', e.target.value)}
            disabled={disabled || isEditMode} // Can't change scheduler after creation
            helperText={isEditMode ? "Cannot be changed after creation" : ""}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Tasks Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Tasks
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addTask}
            disabled={disabled || isEditMode} // Can't add tasks after creation
          >
            Add Task
          </Button>
        </Box>
        
        {isEditMode && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Tasks cannot be added, removed, or modified after job creation
          </Typography>
        )}
        
        {data.spec?.tasks?.map((task, taskIndex) => (
          <Paper 
            key={taskIndex} 
            elevation={2} 
            sx={{ p: 2, mb: 2, opacity: isEditMode ? 0.9 : 1 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Task: {task.name || `Task ${taskIndex + 1}`}
              </Typography>
              {!disabled && !isEditMode && (
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => removeTask(taskIndex)}
                  disabled={data.spec.tasks.length <= 1 || isEditMode}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Task Name"
                  fullWidth
                  required
                  value={task.name || ''}
                  onChange={(e) => updateData(`spec.tasks[${taskIndex}].name`, e.target.value)}
                  disabled={disabled || isEditMode} // Can't change task name after creation
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Replicas"
                  type="number"
                  fullWidth
                  value={task.replicas || 1}
                  onChange={(e) => updateData(`spec.tasks[${taskIndex}].replicas`, parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
                  disabled={disabled || isEditMode} // Can't change replicas after creation
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Containers
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addContainer(taskIndex)}
                  disabled={disabled || isEditMode} // Can't add containers after creation
                >
                  Add Container
                </Button>
              </Box>
              
              {task.template?.spec?.containers?.map((container, containerIndex) => (
                <Paper 
                  key={containerIndex} 
                  variant="outlined" 
                  sx={{ p: 2, mb: 2 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1">
                      Container {containerIndex + 1}
                    </Typography>
                    {!disabled && !isEditMode && (
                      <IconButton
                        edge="end"
                        size="small"
                        color="error"
                        onClick={() => removeContainer(taskIndex, containerIndex)}
                        disabled={task.template.spec.containers.length <= 1 || isEditMode}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Container Name"
                        fullWidth
                        required
                        value={container.name || ''}
                        onChange={(e) => updateData(`spec.tasks[${taskIndex}].template.spec.containers[${containerIndex}].name`, e.target.value)}
                        disabled={disabled || isEditMode} // Can't change container name after creation
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Image"
                        fullWidth
                        required
                        value={container.image || ''}
                        onChange={(e) => updateData(`spec.tasks[${taskIndex}].template.spec.containers[${containerIndex}].image`, e.target.value)}
                        placeholder="nginx:latest"
                        disabled={disabled || isEditMode} // Can't change image after creation
                      />
                    </Grid>
                  </Grid>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Resource Requests & Limits
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="CPU Requests"
                        fullWidth
                        value={container.resources?.requests?.cpu || '100m'}
                        onChange={(e) => updateData(`spec.tasks[${taskIndex}].template.spec.containers[${containerIndex}].resources.requests.cpu`, e.target.value)}
                        placeholder="100m"
                        disabled={disabled || isEditMode} // Can't change resources after creation
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Memory Requests"
                        fullWidth
                        value={container.resources?.requests?.memory || '100Mi'}
                        onChange={(e) => updateData(`spec.tasks[${taskIndex}].template.spec.containers[${containerIndex}].resources.requests.memory`, e.target.value)}
                        placeholder="100Mi"
                        disabled={disabled || isEditMode} // Can't change resources after creation
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="CPU Limits"
                        fullWidth
                        value={container.resources?.limits?.cpu || '1000m'}
                        onChange={(e) => updateData(`spec.tasks[${taskIndex}].template.spec.containers[${containerIndex}].resources.limits.cpu`, e.target.value)}
                        placeholder="1000m"
                        disabled={disabled || isEditMode} // Can't change resources after creation
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Memory Limits"
                        fullWidth
                        value={container.resources?.limits?.memory || '1Gi'}
                        onChange={(e) => updateData(`spec.tasks[${taskIndex}].template.spec.containers[${containerIndex}].resources.limits.memory`, e.target.value)}
                        placeholder="1Gi"
                        disabled={disabled || isEditMode} // Can't change resources after creation
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              
              {(!task.template?.spec?.containers || task.template.spec.containers.length === 0) && (
                <Alert severity="warning">
                  At least one container is required
                </Alert>
              )}
            </Box>
          </Paper>
        ))}
        
        {(!data.spec?.tasks || data.spec.tasks.length === 0) && (
          <Alert severity="warning">
            At least one task is required
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default JobForm;