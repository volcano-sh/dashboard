import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import JobForm from './JobForm';
import axios from 'axios';
import YAML from 'yaml';

/**
 * Enhanced JobDialog that supports both viewing and editing Job resources
 */
const EnhancedJobDialog = ({ 
  open, 
  handleClose, 
  selectedJobName, 
  selectedJobYaml, 
  selectedJobNamespace = 'default',
  mode = 'view', // 'view', 'edit', or 'create'
}) => {
  const [activeTab, setActiveTab] = useState('form');
  const [editableYaml, setEditableYaml] = useState(selectedJobYaml || '');
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Convert HTML-formatted YAML to plain text and parse it
  React.useEffect(() => {
    if (selectedJobYaml) {
      const plainYaml = selectedJobYaml.replace(/<span class="yaml-key">([^<]+)<\/span>/g, '$1');
      setEditableYaml(plainYaml);
      
      try {
        const parsed = YAML.parse(plainYaml);
        setFormData(parsed);
      } catch (err) {
        console.error('Error parsing YAML:', err);
        setError('Failed to parse YAML. The form view may not be available.');
      }
    } else if (mode === 'create') {
      // Set default job template for creation
      const defaultJob = {
        apiVersion: 'batch.volcano.sh/v1alpha1',
        kind: 'Job',
        metadata: {
          name: '',
          namespace: selectedJobNamespace || 'default',
        },
        spec: {
          minAvailable: 1,
          schedulerName: 'volcano',
          queue: 'default',
          tasks: [
            {
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
                          memory: '100Mi',
                        },
                        limits: {
                          cpu: '1000m',
                          memory: '1Gi',
                        },
                      },
                    },
                  ],
                  restartPolicy: 'Never',
                },
              },
            },
          ],
        },
      };
      setFormData(defaultJob);
      setEditableYaml(YAML.stringify(defaultJob));
    }
  }, [selectedJobYaml, mode, selectedJobNamespace]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    if (newValue === 'yaml' && activeTab === 'form') {
      // Form to YAML - update YAML from form data
      try {
        setEditableYaml(YAML.stringify(formData));
      } catch (err) {
        console.error('Error converting form data to YAML:', err);
      }
    } else if (newValue === 'form' && activeTab === 'yaml') {
      // YAML to form - parse YAML
      try {
        const parsed = YAML.parse(editableYaml);
        setFormData(parsed);
        setError(null);
      } catch (err) {
        setError('Invalid YAML. Please fix errors before switching to form view.');
        return; // Don't change tabs if YAML is invalid
      }
    }
    setActiveTab(newValue);
  };

  // Handle YAML text changes
  const handleYamlChange = (event) => {
    setEditableYaml(event.target.value);
  };

  // Handle form data changes
  const handleFormChange = (newData) => {
    setFormData(newData);
  };

  // Handle save
  // In JobDialog.jsx
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dataToSave = activeTab === 'form' 
        ? formData 
        : YAML.parse(editableYaml);
      
      // Log the data being sent
      console.log('Saving job data:', JSON.stringify(dataToSave, null, 2));
      
      if (mode === 'edit') {
        await axios.put(
          `/api/job/${dataToSave.metadata.namespace}/${dataToSave.metadata.name}`,
          dataToSave
        );
      } else if (mode === 'create') {
        await axios.post(
          `/api/jobs`,
          dataToSave
        );
      }
      
      handleClose(true);
    } catch (err) {
      console.error('Error saving job:', err);
      // Log more error details
      if (err.response) {
        console.error('Response error data:', err.response.data);
      }
      setError(err.response?.data?.message || err.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = mode === 'edit' || mode === 'create';
  const dialogTitle = 
    mode === 'view' ? `Job YAML - ${selectedJobName}` :
    mode === 'edit' ? `Edit Job - ${selectedJobName}` :
    'Create New Job';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '80%',
          maxWidth: '900px',
          maxHeight: '90vh',
          m: 2,
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {dialogTitle}
        <IconButton onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      {isEditMode && (
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab 
            value="form" 
            label="Form View" 
            icon={<FormatListBulletedIcon />} 
            iconPosition="start" 
          />
          <Tab 
            value="yaml" 
            label="YAML View" 
            icon={<CodeIcon />} 
            iconPosition="start" 
          />
        </Tabs>
      )}
      
      <DialogContent>
        {error && (
          <Box 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: 'error.light', 
              color: 'error.contrastText',
              borderRadius: 1
            }}
          >
            {error}
          </Box>
        )}
        
        {isEditMode && activeTab === 'form' ? (
          // Form view
          <Box sx={{ mt: 1 }}>
            {formData && (
              <JobForm 
                data={formData} 
                onChange={handleFormChange} 
                disabled={loading}
              />
            )}
          </Box>
        ) : (
          // YAML view - either editable in edit mode or read-only in view mode
          <Box
            sx={{
              mt: 2,
              mb: 2,
              fontFamily: 'monospace',
              fontSize: '1rem',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              maxHeight: 'calc(90vh - 200px)',
              bgcolor: 'grey.50',
              p: 2,
              borderRadius: 1,
            }}
          >
            {isEditMode ? (
              <Box
                component="textarea"
                value={editableYaml}
                onChange={handleYamlChange}
                disabled={loading}
                sx={{
                  width: '100%',
                  height: 'calc(90vh - 250px)',
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  resize: 'none',
                }}
              />
            ) : (
              <pre
                dangerouslySetInnerHTML={{
                  __html: selectedJobYaml,
                }}
              />
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 2,
            width: '100%',
            px: 2,
            pb: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{ mr: 2 }}
            disabled={loading}
          >
            {isEditMode ? 'Cancel' : 'Close'}
          </Button>
          
          {isEditMode && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
              startIcon={<SaveIcon />}
              sx={{
                minWidth: '100px',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedJobDialog;