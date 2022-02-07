import React from 'react';
import './Right.css';
import { Card, Dropdown, DropdownButton } from 'react-bootstrap';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const Right = () => {
    return (
        <div className='right'>
            <Card>
                <Card.Body>
                    <div className='events'>
                        <Card.Text>Events</Card.Text>
                        <a>View all</a>
                    </div>
                    <hr />
                    <div className='section'>
                        <Card.Subtitle>
                            3 minutes ago
                        </Card.Subtitle>
                        <div className='profile'>
                            <span className='profile-icon'>M</span>
                            <Card.Subtitle>
                                ci-in-br3wpjb-d5d6b worker-us-east-la-llzim
                            </Card.Subtitle>
                        </div>
                        <p className="content">Updated machine ci-in-br3wpjb-d5d6b-worker-us-east-la-llzim</p>
                    </div>
                    <hr />
                    <div className='section'>
                        <Card.Subtitle>
                            3 minutes ago
                        </Card.Subtitle>
                        <div className='profile'>
                            <span className='profile-icon'>M</span>
                            <Card.Subtitle>
                                aedb385-sgemt341
                            </Card.Subtitle>
                        </div>
                        <p className="content">Updated machine ci-in-br3wpjb-d5d6b-master-2</p>
                    </div>
                    <hr />
                    <div className='section'>
                        <Card.Subtitle>
                            Oct 1, 9:44 am
                        </Card.Subtitle>
                        <div className='profile'>
                            <span className='profile-icon'>M</span>
                            <Card.Subtitle>
                                revision-pruner-5-ip-10-0-152-49.ec2.internal
                            </Card.Subtitle>
                        </div>
                        <p className="content">Conainer image</p>
                        <p className="content">registry.svc.ci.openshift.org/ocp/4.2-2019-09-30-192219@sha256:7a379 already present on machine</p>
                    </div>
                </Card.Body>
            </Card>
            <Card className='consumers-card'>
                <Card.Body>
                    <Card.Text>Top Consumers</Card.Text>
                    <hr />
                    <div className='dropdown'>
                        <DropdownButton id="dropdown-basic-button" title="Pods">
                            <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
                            <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
                            <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
                        </DropdownButton>
                        <DropdownButton id="dropdown-basic-button" title="By CPU">
                            <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
                            <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
                            <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
                        </DropdownButton>
                    </div>
                    <hr />
                    <Card.Subtitle>Pods by CPU Time</Card.Subtitle>
                    <div className='cpu-time'>     
                        <a>
                            kube-apiserver-ip-10-0-140-227.ec2.internal
                        </a>                  
                        <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress variant="determinate" value={20} />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">156.4 ms</Typography>
                            </Box>
                        </Box>
                        </Box>
                    </div>
                    <div className='cpu-time'>     
                        <a>
                            kube-server-ip-10-0-133-201.ec2.internal
                        </a>                  
                        <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress variant="determinate" value={20} />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">120 ms</Typography>
                            </Box>
                        </Box>
                        </Box>
                    </div>
                    <div className='cpu-time'>     
                        <a>
                            prometheus-k8s-0
                        </a>                  
                        <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress variant="determinate" value={20} />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">119.5 ms</Typography>
                            </Box>
                        </Box>
                        </Box>
                    </div>
                    <div className='cpu-time'>     
                        <a>
                            prometheus-k8s-1
                        </a>                  
                        <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress variant="determinate" value={20} />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">116.4 ms</Typography>
                            </Box>
                        </Box>
                        </Box>
                    </div>
                    <div className='cpu-time'>     
                        <a>
                            etcd-member-ip-10-0-133-201.ec2.internal
                        </a>                  
                        <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress variant="determinate" value={20} />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">73.89 ms</Typography>
                            </Box>
                        </Box>
                        </Box>
                    </div>
                    <a style={{fontSize:'13px'}}>
                        View More
                    </a> 
                </Card.Body>
            </Card>
        </div>
    )
}

export default Right
