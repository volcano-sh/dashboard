import { createContext, useContext } from "react";

export const EventContext = createContext(null);

export const useEvent = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error("useEventContext must be used within an EventProvider");
    }
    return context;
};
