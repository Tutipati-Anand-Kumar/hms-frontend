import React, { createContext, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api/authservices/authservice";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
   
    useEffect(() => {
        // Multi-tab synchronization logic has been DISABLED as per request.
        // Tabs will now operate independently.
        /*
        const handleStorageChange = (e) => {
            if (e.key === "hms_event" && e.newValue) {
                // ... sync logic removed
            }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
        */
    }, []);

    return (
        <AuthContext.Provider value={{}}>
            {children}
        </AuthContext.Provider>
    );
};
