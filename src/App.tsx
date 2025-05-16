// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

const PublicRoute = ({ children }: { children: React.ReactElement }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: "'Poppins', sans-serif" }}>Loading App...</div>;
    }

    if (isAuthenticated) {
        const from = location.state?.from?.pathname;
        if (from && from !== '/login' && from !== '/signup') {
            return <Navigate to={from} replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

function App() {
    const { isLoading, isAuthenticated } = useAuth(); // Also get isAuthenticated for default route logic

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: "'Poppins', sans-serif" }}>Initializing Authentication...</div>;
    }

    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route
                path="/dashboard"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />
            {/* Default route: if authenticated go to dashboard, else to login. */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
    );
}

export default App;
