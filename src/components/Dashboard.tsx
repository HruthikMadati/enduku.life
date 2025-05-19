// src/components/Dashboard.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext.tsx is in src/context

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '40px auto' }}>
            <h2>Dashboard</h2>
            {/* Add your dashboard content here */}
        </div>
    );
};

export default Dashboard; // Default export