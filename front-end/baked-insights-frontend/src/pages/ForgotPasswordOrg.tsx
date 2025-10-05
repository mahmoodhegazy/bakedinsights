import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';


export const ForgotPasswordOrg: React.FC = () => {
    const navigate = useNavigate();

    const [tenant, setTenant] = useState("");
    const [email, setEmail] = useState("");
    const [isDisabled, setIsDisabled] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsDisabled(true);
        const formValues = { tenant, email };

        // Validate the form
        if (email.length === 0) {
            toast.error("Email is required.");
            setIsDisabled(false);
            return null;
        }

        // Post request to API
        try {
            await api.post(`/auth/forgot-password/${formValues.tenant}`, formValues);
            setIsDisabled(false);
            toast.success('Verification code sent succesfully.');
            navigate(`/forgot-password/${formValues.tenant}/reset`);
        } catch (error: any) {
            setIsDisabled(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Enter the email associated with your account
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
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                id="email"
                                type="text"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email"
                                autoComplete="off"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isDisabled}
                            className={`${isDisabled ? "bg-gray-400 text-white" : "text-white bg-gray-700 hover:bg-gray-900"} group relative w-full flex text-left py-2 px-4 border border-transparent text-sm font-medium rounded-b-md focus:outline-none focus:ring-0`}
                        >
                            Send login code
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};