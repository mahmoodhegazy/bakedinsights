import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';


export const LoginOrg: React.FC = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuth();

    const [tenant, setTenant] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formValues = { tenant, username, password };
        console.log(formValues);

        // Validate the form
        if (username.length === 0) {
            toast.error("Username is required.");
            return null;
        } else if (password.length === 0) {
            toast.error("Password is required.");
            return null;
        }

        // Post request to API
        try {
            const { data } = await api.post(`/auth/login/${formValues.tenant}`, formValues);
            setAuth(data.access_token);
            toast.success('Login succesful');
            navigate('/tables');
        } catch (error: any) {
            // pass
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-lg shadow-md -space-y-px">
                        <div>
                            <label htmlFor="tenant_id" className="sr-only">Tenant ID</label>
                            <input
                                id="tenant_id"
                                type="number"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Organization Code"
                                autoComplete="off"
                                onChange={(e) => setTenant(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <input
                                id="username"
                                type="text"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Username"
                                autoComplete="off"
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                autoComplete="off"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="group relative w-full flex text-left py-2 px-4 border border-transparent text-sm font-medium rounded-b-md text-white bg-gray-700 hover:bg-gray-900 focus:outline-none focus:ring-0"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
                <div className="m-0 p-2 font-medium text-sky-800 hover:text-sky-600 text-sm">
                    <Link to={`/forgot-password/${tenant}`}>Forgot password?</Link>
                </div>
            </div>
        </div>
    );
};