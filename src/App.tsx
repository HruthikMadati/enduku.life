import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';           // Named import
import Signup from './components/Signup';         // Default import (was already like this in last version)
import './index.css';
import { Box, CircularProgress, Typography } from '@mui/material';

// Add a component to redirect authenticated users away from auth pages
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      window.location.replace('https://enduku.life');
    }
  }, [isAuthenticated]);
  
  if (isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
};

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Initializing Authentication...
        </Typography>
      </Box>
    );
  }

  return (
    <div className="App">
      <Box component="main" sx={{ p: 3 }}>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />
          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
        </Routes>
      </Box>
    </div>
  );
}

export default App;