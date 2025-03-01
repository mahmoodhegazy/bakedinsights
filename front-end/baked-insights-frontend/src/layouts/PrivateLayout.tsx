import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './../hooks/useAuth';
import { Sidebar } from '../components/Sidebar';

export const PrivateLayout = ({ orgName = "" }) => {
    const { token } = useAuth();

    if (!token) {
        return <Navigate to='/login' replace />;
    }
    return (
        <>
        <Sidebar orgName={orgName} />
        <Outlet />
        </>
    );
};