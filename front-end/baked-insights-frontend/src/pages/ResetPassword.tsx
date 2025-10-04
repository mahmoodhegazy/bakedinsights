import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';


export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const { tenant_id } = useParams<{ tenant_id: string }>();

    const [otp, setOTP] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formValues = { otp, password };

        // Validate the form
        if (otp.length === 0) {
            toast.error("Verification code is required.");
            return null;
        } else if (password.length === 0) {
            toast.error("Password is required.");
            return null;
        }

        // Post request to API
        try {
            await api.post(`/auth/reset-password/${tenant_id}`, formValues);
            toast.success('Password reset');
            navigate(`/login/${tenant_id}`);
        } catch (error: any) {
            // pass
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Reset your password
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-lg shadow-md -space-y-px">
                        <div>
                            <label htmlFor="otp" className="sr-only">Verification code</label>
                            <input
                                id="otp"
                                type="text"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Verification code"
                                autoComplete="off"
                                onChange={(e) => setOTP(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">New Password</label>
                            <input
                                id="password"
                                type="password"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="New Password"
                                autoComplete="off"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="group relative w-full flex text-left py-2 px-4 border border-transparent text-sm font-medium rounded-b-md text-white bg-gray-700 hover:bg-gray-900 focus:outline-none focus:ring-0"
                        >
                            Reset password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};