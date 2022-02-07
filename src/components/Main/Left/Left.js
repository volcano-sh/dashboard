import React from 'react';
import './Left.css'
import { Card } from 'react-bootstrap'

const Left = () => {
    return (
        <div className='left'>
            <Card>
                <Card.Body>
                    <Card.Text>Details</Card.Text>
                    <hr />
                    <Card.Subtitle style={{ marginTop: "15px" }}>Cluster ID</Card.Subtitle>
                    <Card.Text>
                        aedb385-sgemt341
                    </Card.Text>
                    <Card.Subtitle>Provider</Card.Subtitle>
                    <Card.Text>
                        AWS
                    </Card.Text>
                    <Card.Subtitle>OpenShift Version</Card.Subtitle>
                    <Card.Text>
                        4.2.0-0.ci-2019
                    </Card.Text>
                </Card.Body>
            </Card>
            <Card className='inventory'>
                <Card.Body>
                    <Card.Text>
                        Cluster Inventory
                    </Card.Text>
                    <hr />
                    <Card.Subtitle>6 Nodes</Card.Subtitle>
                    <hr />
                    <Card.Subtitle>189 Pods</Card.Subtitle>
                    <hr />
                    <Card.Subtitle style={{ marginBottom: '2px' }}>0 PVCs</Card.Subtitle>
                </Card.Body>
            </Card>
        </div>
    )
}

export default Left
