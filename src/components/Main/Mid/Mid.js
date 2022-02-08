import React from 'react';
import './Mid.css';
import { Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const Mid = () => {
    return (
        <div className='mid'>
            <Card className='health'>
                <Card.Body>
                    <Card.Text>Cluster Health</Card.Text>
                    <hr />
                    <div className='health-box'>
                        <FontAwesomeIcon icon={faCheck} />
                        <Card.Text>Cluster is healthy</Card.Text>
                    </div>
                </Card.Body>
            </Card>
            <Card className='capacity'>
                <Card.Body>
                    <Card.Text>Cluster Capacity</Card.Text>
                    <hr />
                    <div className='capacity-box'>
                        <div className='box'>
                            <Card.Text>CPU</Card.Text>
                            <Card.Text>90.9% available out of 100%</Card.Text>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <CircularProgress variant="determinate" value={9} />
                                <Box
                                    sx={{
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Typography variant="caption" component="div" color="text.secondary">
                                        {`${Math.round(9)}%`}
                                    </Typography>
                                </Box>
                            </Box>
                        </div>
                        <div className='box'>
                            <Card.Text>Memory</Card.Text>
                            <Card.Text>90 Gi available out of 93 Gi</Card.Text>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <CircularProgress variant="determinate" value={4} />
                                <Box
                                    sx={{
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Typography variant="caption" component="div" color="text.secondary">
                                        {`${Math.round(4)}%`}
                                    </Typography>
                                </Box>
                            </Box>
                        </div>
                        <div className='box'>
                            <Card.Text>Storage</Card.Text>
                            <Card.Text>2.7 Ti available out of 3 Ti</Card.Text>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <CircularProgress variant="determinate" value={5} />
                                <Box
                                    sx={{
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Typography variant="caption" component="div" color="text.secondary">
                                        {`${Math.round(5)}%`}
                                    </Typography>
                                </Box>
                            </Box>
                        </div>
                        <div className='box'>
                            <Card.Text>Network</Card.Text>
                            <Card.Text>7.5 GBps available out of 7.5 GBps</Card.Text>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <CircularProgress variant="determinate" value={0} />
                                <Box
                                    sx={{
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Typography variant="caption" component="div" color="text.secondary">
                                        {`${Math.round(0)}%`}
                                    </Typography>
                                </Box>
                            </Box>
                        </div>
                    </div>
                </Card.Body>
            </Card>
            <Card className='utilization'>
                <Card.Body>
                    <Card.Text>Cluster Utilization</Card.Text>
                    <hr />
                    <div className='utilization-box'>
                        <div className='box'>
                            <Card.Text>CPU</Card.Text>
                            <Card.Text>9.1%</Card.Text>
                        </div>
                        <hr />
                        <div className='box'>
                            <Card.Text>Memory</Card.Text>
                            <Card.Text>3.5 Gi</Card.Text>
                        </div>
                        <hr />
                        <div className='box' style={{marginBottom: "-10px"}}>
                            <Card.Text>Disk Usage</Card.Text>
                            <Card.Text>140 Gi</Card.Text>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    )
}

export default Mid