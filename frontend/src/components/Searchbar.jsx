// SearchBar.js
import React, { useState } from "react";
import {
    Container,
    Row,
    Col,
    Form,
    Button,
    InputGroup,
    Card,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes, faRedo } from "@fortawesome/free-solid-svg-icons";
import CreateDialog from "./CreateDialog";
import CreateJobDialog from "./jobs/JobTable/CreateJobDialog";

const SearchBar = ({
    searchText,
    handleSearch,
    handleClearSearch,
    handleRefresh,
    fetchData,
    isRefreshing,
    dialogTitle,
    dialogResourceNameLabel,
    dialogResourceType,

    placeholder,
    refreshLabel,
    onCreateClick,
    createlabel,
}) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleOpenDialog = () => setDialogOpen(true);
    const handleCloseDialog = () => setDialogOpen(false);

    const handleDialogCreate = async (resourceData) => {
        if (onCreateClick) {
            await onCreateClick(resourceData);
        }
        setDialogOpen(false);
    };

    return (
        <>
            <Card className="mb-3 border-0 rounded-lg">
                <Card.Body className="py-3">
                    <Container fluid className="px-0">
                        <Row className="align-items-center justify-content-between g-2">
                            <Col xs={12} md={5} lg={3}>
                                <InputGroup
                                    className="border rounded-pill overflow-hidden shadow-sm bg-white"
                                    style={{
                                        height: "35px",
                                        maxWidth: "250px",
                                    }}
                                >
                                    <Button
                                        variant="outline-white"
                                        className="border-0 bg-transparent text-primary d-flex align-items-center px-2"
                                        onClick={() => fetchData()}
                                        disabled={isRefreshing}
                                        style={{ height: "100%" }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faSearch}
                                            className="me-1"
                                            style={{ color: "#E34C26" }}
                                        />
                                        {isRefreshing && (
                                            <span
                                                className="spinner-border spinner-border-sm text-primary"
                                                role="status"
                                            ></span>
                                        )}
                                    </Button>
                                    <Form.Control
                                        placeholder={placeholder}
                                        value={searchText}
                                        onChange={handleSearch}
                                        className="border-0 shadow-none px-3"
                                        style={{
                                            fontSize: "0.9rem",
                                            height: "100%",
                                        }}
                                    />
                                    {searchText && (
                                        <Button
                                            variant="outline-white"
                                            className="border-0 bg-transparent d-flex align-items-center px-2"
                                            onClick={handleClearSearch}
                                            disabled={isRefreshing}
                                            style={{ height: "100%" }}
                                        >
                                            <FontAwesomeIcon
                                                icon={faTimes}
                                                className="text-secondary"
                                            />
                                        </Button>
                                    )}
                                </InputGroup>
                            </Col>

                            <Col
                                xs="auto"
                                className="d-flex align-items-center gap-2"
                            >
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="rounded-pill px-4 py-2 d-flex align-items-center justify-content-center shadow-sm fw-medium border-2"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    style={{
                                        backgroundColor: "#E34C26",
                                        color: "white",
                                        transition: "all 0.3s ease",
                                        height: "35px",
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faRedo}
                                        className="me-1"
                                        spin={isRefreshing}
                                        style={{ color: "white" }}
                                    />
                                    <span>
                                        {isRefreshing
                                            ? "Refreshing..."
                                            : refreshLabel}
                                    </span>
                                </Button>

                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="rounded-pill px-4 py-2 d-flex align-items-center justify-content-center shadow-sm fw-medium border-2"
                                    onClick={handleOpenDialog}
                                    style={{
                                        backgroundColor: "#E34C26",
                                        color: "white",
                                        transition: "all 0.3s ease",
                                        height: "35px",
                                    }}
                                >
                                    <span>{createlabel}</span>
                                </Button>
                            </Col>
                        </Row>
                    </Container>
                </Card.Body>
            </Card>

            {/* For Queue Dialog */}
            {dialogResourceType === "Queue" && (
                <CreateDialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    onCreate={handleDialogCreate}
                    title={dialogTitle}
                    resourceNameLabel={dialogResourceNameLabel}
                    resourceType={dialogResourceType}
                />
            )}

            {dialogResourceType === "Job" && (
                <CreateJobDialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    onCreate={handleDialogCreate}
                    title={dialogTitle}
                    resourceNameLabel={dialogResourceNameLabel}
                    resourceType={dialogResourceType}
                />
            )}
        </>
    );
};

export default SearchBar;
