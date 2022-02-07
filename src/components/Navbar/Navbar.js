import React from 'react';
import { Navbar, Container, Offcanvas, Nav, NavDropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTh, faPlus, faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import './Navbar.css'
import logo from '../../assets/volcano.png'

const NavBar = () => {
    return (
        <div>
            <Navbar bg="dark" expand={false}>
                <Container fluid>
                    <div className='navbar-block'>
                        <Navbar.Toggle aria-controls="offcanvasNavbar" />
                        <img src={logo} alt="logo"/>
                    </div>
                    <div className='navbar-block'>
                        <FontAwesomeIcon className='text-light' icon={faTh} />
                        <FontAwesomeIcon className='text-light' icon={faPlus} />
                        <FontAwesomeIcon className='text-light' icon={faQuestionCircle} />
                        <NavDropdown title="kube:admin" id="offcanvasNavbarDropdown">
                            <NavDropdown.Item className="text-white" href="#">admin 1</NavDropdown.Item>
                            <NavDropdown.Item className="text-white" href="#">admin 2</NavDropdown.Item>
                        </NavDropdown>
                    </div>
                    <Navbar.Offcanvas
                        id="offcanvasNavbar"
                        aria-labelledby="offcanvasNavbarLabel"
                        placement="start"
                        className="bg-dark"
                    >
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title id="offcanvasNavbarLabel"></Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <Nav className="justify-content-end flex-grow-1 pe-3">
                                <NavDropdown title="Administrator" id="offcanvasNavbarDropdown">
                                    <NavDropdown.Item className="text-white" href="#">Action</NavDropdown.Item>
                                    <NavDropdown.Item className="text-white" href="#">Another action</NavDropdown.Item>
                                </NavDropdown>
                                <NavDropdown title="Home" id="offcanvasNavbarDropdown">
                                    <NavDropdown.Item className="text-white" href="#">Dashboards</NavDropdown.Item>
                                    <NavDropdown.Item className="text-white" href="#">Projects</NavDropdown.Item>
                                    <NavDropdown.Item className="text-white" href="#">Search</NavDropdown.Item>
                                    <NavDropdown.Item className="text-white" href="#">Explore</NavDropdown.Item>
                                    <NavDropdown.Item className="text-white" href="#">Events</NavDropdown.Item>
                                </NavDropdown>
                                <Nav.Link href="#" className="text-white">Operators</Nav.Link>
                                <NavDropdown.Divider />
                                <Nav.Link href="#" className="text-white">Workloads</Nav.Link>
                                <NavDropdown.Divider />
                                <Nav.Link href="#" className="text-white">Networking</Nav.Link>
                                <NavDropdown.Divider />
                                <Nav.Link href="#" className="text-white">Storage</Nav.Link>
                                <NavDropdown.Divider />
                                <Nav.Link href="#" className="text-white">Builds</Nav.Link>
                                <NavDropdown.Divider />
                                <Nav.Link href="#" className="text-white">Monitoring</Nav.Link>
                                <NavDropdown.Divider />
                                <Nav.Link href="#" className="text-white">Compute</Nav.Link>
                                <NavDropdown.Divider />
                                <Nav.Link href="#" className="text-white">Administration</Nav.Link>
                                <NavDropdown.Divider />
                            </Nav>
                        </Offcanvas.Body>
                    </Navbar.Offcanvas>
                </Container>
            </Navbar>
        </div>
    )
}

export default NavBar