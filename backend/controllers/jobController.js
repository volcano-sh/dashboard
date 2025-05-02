import { k8sCoreApi, k8sApi } from '../services/k8sClient.js';


// Get all jobs with filters
export const getAllJobs = async (req, res) => {
    try {
        const { namespace = '', search = '', queue = '', status = '' } = req.query;

        let response;
        if (namespace === '' || namespace === 'All') {
            response = await k8sApi.listClusterCustomObject('batch.volcano.sh', 'v1alpha1', 'jobs', true);
        } else {
            response = await k8sApi.listNamespacedCustomObject('batch.volcano.sh', 'v1alpha1', namespace, 'jobs', true);
        }

        let filteredJobs = response.body.items || [];

        if (search) {
            filteredJobs = filteredJobs.filter(job =>
                job.metadata.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (queue && queue !== 'All') {
            filteredJobs = filteredJobs.filter(job => job.spec.queue === queue);
        }

        if (status && status !== 'All') {
            filteredJobs = filteredJobs.filter(job => job.status.state.phase === status);
        }

        res.json({
            items: filteredJobs,
            totalCount: filteredJobs.length,
        });
    } catch (err) {
        console.error('Error fetching jobs:', err);
        res.status(500).json({
            error: 'Failed to fetch jobs',
            details: err.message,
        });
    }
};

// Get details of a specific job
export const getJobDetails = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sApi.getNamespacedCustomObject(
            'batch.volcano.sh',
            'v1alpha1',
            namespace,
            'jobs',
            name
        );
        res.json(response.body);
    } catch (err) {
        console.error('Error fetching job:', err);
        res.status(500).json({
            error: 'Failed to fetch job',
            details: err.message,
        });
    }
};

// Get YAML of a specific job
export const getJobYaml = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sApi.getNamespacedCustomObject(
            'batch.volcano.sh',
            'v1alpha1',
            namespace,
            'jobs',
            name
        );
        const formattedYaml = yaml.dump(response.body, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
        });
        res.setHeader('Content-Type', 'text/yaml');
        res.send(formattedYaml);
    } catch (error) {
        console.error('Error fetching job YAML:', error);
        res.status(500).json({
            error: 'Failed to fetch job YAML',
            details: error.message,
        });
    }
};

// Get all jobs without pagination
export const getAllJobsWithoutPagination = async (req, res) => {
    try {
        const response = await k8sApi.listClusterCustomObject(
            'batch.volcano.sh',
            'v1alpha1',
            'jobs', 
            {
                pretty: true,
            }
        );
        res.json({
            items: response.body.items,
            totalCount: response.body.items.length,
        });
    } catch (err) {
        console.error('Error fetching all jobs:', err);
        res.status(500).json({ error: 'Failed to fetch all jobs' });
    }
};
