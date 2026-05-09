import React, { createContext, useContext, useState, useEffect } from "react";

const ClusterContext = createContext();

export const useCluster = () => useContext(ClusterContext);

export const ClusterProvider = ({ children }) => {
    const [clusters, setClusters] = useState([]);
    const [currentCluster, setCurrentCluster] = useState(
        localStorage.getItem("currentCluster") || "default",
    );

    useEffect(() => {
        localStorage.setItem("currentCluster", currentCluster);
    }, [currentCluster]);

    useEffect(() => {
        const fetchClusters = async () => {
            try {
                const response = await fetch("/api/v1/clusters");
                if (response.ok) {
                    const data = await response.json();
                    setClusters(data);
                    if (data.length > 0 && !data.find(c => c.name === "default")) {
                        // If default not found, pick the first one
                        setCurrentCluster(data[0].name);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch clusters:", error);
            }
        };
        fetchClusters();
    }, []);

    const value = {
        clusters,
        currentCluster,
        setCurrentCluster,
    };

    return (
        <ClusterContext.Provider value={value}>
            {children}
        </ClusterContext.Provider>
    );
};
