// src/components/PrivateRoute.tsx
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext.tsx is in src/context

interface PrivateRouteProps {
    children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const { isAuthenticated, user } = useAuth(); // Assuming 'user' is populated when authenticated
    const location = useLocation();

    // If still checking auth state, or user is null but isAuthenticated might be true briefly
    // you might want a loading indicator here. For simplicity, we'll rely on isAuthenticated.
    // If user object itself is the primary source of truth for being logged in:
    // if (!user) {

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience
        // than dropping them off on the home page.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default PrivateRoute; // Default export