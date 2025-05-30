const filterToggle = ({ filters, visibleCol, setVisibleCol }) => {
    const handleToggle = (col) => {
        setVisibleCol((prev) => ({
            ...prev,
            [col]: !prev[col],
        }));
    };

    return (
        <div className="filter-toggle">
            {Object.keys(visibleCol).map((col) => (
                <button
                    key={col}
                    onClick={() => handleToggle(col)}
                    className={`toggle-button ${visibleCol[col] ? "active" : ""}`}
                >
                    {filters[col].label}
                </button>
            ))}
        </div>
    );
}

export default filterToggle;