import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {

    const { token, isAdmin, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="text-center py-20">Проверка прав доступа...</div>;
    }

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}