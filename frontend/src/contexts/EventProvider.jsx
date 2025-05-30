import { useCallback, useEffect, useRef } from "react";
import { EventContext } from "./EventContext";

const EventProvider = ({ children }) => {
    const esRef = useRef(null);
    const updateCallbackRef = useRef(null);

    const onUpdateEvent = useCallback((callback) => {
        updateCallbackRef.current = callback;
    }, []);

    const getUpdateEvents = () => {
        try {
            const es = new EventSource("/api/get-update-events");
            es.onopen = () => {
                esRef.current = es;
            };
            es.onmessage = (event) => {
                const obj = JSON.parse(event.data);
                if (updateCallbackRef.current) {
                    updateCallbackRef.current(obj);
                }
            };
            es.onerror = (err) => {
                console.error("EventSource error:", err);
            };
        } catch (err) {
            console.error("Error fetching update events:", err);
        }
    };

    useEffect(() => {
        getUpdateEvents();

        return () => {
            if (esRef.current) {
                esRef.current.close();
            }
            esRef.current = null;
            updateCallbackRef.current = null;
        };
    }, []);

    return (
        <EventContext.Provider value={{ onUpdateEvent }}>
            {children}
        </EventContext.Provider>
    );
};

export default EventProvider;
