// src/components/Dashboard.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext.tsx is in src/context

const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
            // Navigate to login or home page after sign out is handled by AuthContext or PrivateRoute
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '40px auto' }}>
            <h2>Dashboard</h2>
            {user && (
                <div>
                    <p>Welcome, {user.username || user.attributes?.email || 'User'}!</p>
                    {/* You can display more user attributes if needed, e.g., user.attributes.email */}
                </div>
            )}
            <button
                onClick={handleSignOut}
                style={{
                    padding: '10px 15px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '20px'
                }}
            >
                Sign Out
            </button>
        </div>
    );
};

export default Dashboard; // Default export