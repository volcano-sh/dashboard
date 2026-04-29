const sessionTokenKey = "volcano-dashboard-token";
const localTokenKey = "volcano-dashboard-token-remembered";

export const getStoredToken = () => {
    if (typeof window === "undefined") return "";
    return (
        window.sessionStorage.getItem(sessionTokenKey) ||
        window.localStorage.getItem(localTokenKey) ||
        ""
    );
};

export const storeToken = (token, remember = false) => {
    if (typeof window === "undefined") return;
    clearStoredToken();
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(remember ? localTokenKey : sessionTokenKey, token);
};

export const clearStoredToken = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(sessionTokenKey);
    window.localStorage.removeItem(localTokenKey);
};
