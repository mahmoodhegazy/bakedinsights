import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/images/B-logo.png';
import { useUsers } from '../hooks/useUsers';
import { useSidebarState } from '../hooks/useSidebarState';
import { useChatState } from '../hooks/useChatState';
import ChatWindow from '../components/Chat/ChatWindow'; 
import { FaRobot } from 'react-icons/fa';

export const Sidebar = ({ orgName="" }) => {
    // Use global sidebar state for visibility management
    const { isVisible, toggle } = useSidebarState();
    const [adminDropdownVisible, setAdminDropdownVisible] = useState(true);
    const { isVisible: isChatVisible, toggle: toggleChat } = useChatState();
    const { logout } = useAuth();

    // Add debug handler
    const handleChatToggle = () => {
        console.log('Current chat visibility:', isChatVisible);
        toggleChat();
        console.log('Chat visibility after toggle:', !isChatVisible);
    };

    const { currentUser } = useUsers();

    const navlinkClass = ({ isActive } : { isActive: boolean }) =>
        isActive
         ? "flex items-center p-2 rounded-lg text-gray-900 bg-gray-100 group"
         : "flex items-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 group group-hover:text-gray-900";

    const subNavlinkClass = ({ isActive } : { isActive: boolean } ) =>
        isActive
         ? "flex items-center p-2 pl-11 rounded-lg text-gray-900 bg-gray-100 group"
         : "flex items-center p-2 pl-11 rounded-lg text-gray-500 hover:bg-gray-100 group group-hover:text-gray-900";

    return (
        <>
        <nav className="fixed h-16 top-0 z-50 w-full bg-white shadow-sm">
            <div className="px-3 py-3 lg:px-5 lg:pl-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-start rtl:justify-end">
                        <div className="flex ms-2 md:me-24">
                            <img src={logo} className="h-8 me-3" alt="BakedInsights Logo" />
                            <span className="self-center text-xl font-semibold whitespace-nowrap">{ orgName }</span>
                        </div>
                    </div>
                    <div className="flex items-center ms-3">
                        <button 
                            onClick={handleChatToggle}  // Use debug handler here
                            type="button" 
                            className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-0 me-2"
                        >
                            <span className="sr-only">Open AI chat</span>
                            <FaRobot className="w-6 h-6" />
                        </button>
                        <button onClick={toggle} aria-controls="logo-sidebar" type="button" className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-0">
                            <span className="sr-only">Open sidebar</span>
                            <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <aside id="logo-sidebar" className={`${isVisible ? "translate-x-0" : "-translate-x-full"} fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform bg-white border-r border-gray-200`} aria-label="Sidebar">
            <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
                <ul className="space-y-2 font-medium">
                    <li>
                        <NavLink
                            to="/tables"
                            className={navlinkClass}
                        >
                        <svg className="flex-shrink-0 w-5 h-5 transition duration-75" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 18">
                            <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"/>
                        </svg>
                        <span className="flex-1 ms-3 whitespace-nowrap">Tables</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/checklists"
                            className={navlinkClass}
                        >
                        <svg className="flex-shrink-0 w-5 h-5 transition duration-75 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z"/>
                            <path d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z"/>
                            <path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z"/>
                        </svg>
                        <span className="flex-1 ms-3 whitespace-nowrap">Checklists</span>
                        </NavLink>
                    </li>
                    <li>
                        <button
                            onClick={() => setAdminDropdownVisible((prevState) => !prevState)}
                            type="button"
                            className="flex items-center w-full p-2 text-base text-gray-500 hover:bg-gray-100 group group-hover:text-gray-900 transition duration-75 rounded-lg"
                            aria-controls="admin-dropdown"
                        >
                            <svg className="flex-shrink-0 w-5 h-5 transition duration-75" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                                <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z"/>
                            </svg>
                            <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Admin Console</span>
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                            </svg>
                        </button>
                        <ul id="admin-dropdown" className={`${(adminDropdownVisible ? "visible" : "hidden")} py-2 space-y-2`}>
                            {currentUser?.is_admin_role &&
                                <li>
                                    <NavLink
                                        to="/admin/users"
                                        className={subNavlinkClass}
                                    >
                                        Users
                                    </NavLink>
                                </li>
                            }
                            <li>
                                <NavLink
                                    to="/admin/profile"
                                    className={subNavlinkClass}
                                >
                                    My Profile
                                </NavLink>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <NavLink
                            to="/login"
                            className={navlinkClass}
                            onClick={logout}
                        >
                        <svg className="flex-shrink-0 w-5 h-5 transition duration-75" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"/>
                        </svg>
                        <span className="flex-1 ms-3 whitespace-nowrap">Sign Out</span>
                        </NavLink>
                    </li>
                </ul>
            </div>
        </aside>
        {/* {console.log('Rendering ChatWindow with isOpen:', isChatVisible)} */}
        <ChatWindow isOpen={isChatVisible} onClose={toggleChat} />
        </>
    );
};