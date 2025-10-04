import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './../hooks/useAuth';
import { Sidebar } from '../components/Sidebar';

export const PrivateLayout = ({ orgName = "" }) => {
    const { getToken } = useAuth();
    const token = getToken();

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