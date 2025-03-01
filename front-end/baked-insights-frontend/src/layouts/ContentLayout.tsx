import { Outlet } from 'react-router-dom';
import React from 'react';
import { useSidebarState } from '../hooks/useSidebarState';
import { FaCopyright } from 'react-icons/fa';

export const ContentLayout: React.FC = () => {
    const { isVisible } = useSidebarState();

  return (
    <>
    <div dir="ltr">
      <div className="relative top-16 left-0 w-full h-[calc(100vh-64px)] overflow-y-hidden bg-gray-200">
        <div className="h-full overflow-y-auto">
            <div className={`h-full p-4 transition-all duration-300 ${isVisible ? 'sm:ml-64' : 'sm:ml-0'}`}>
                <div className="h-full relative overflow-x-auto">
                    <div className="flex flex-col flex-1 max-h-full shadow-md sm:rounded-lg p-4 bg-white">
                        <Outlet />
                        <div className="mt-auto p-2 border-t border-gray-300 font-bold text-gray-300 text-sm text-right flex flex-row-reverse">
                            <FaCopyright className="mx-1 mt-1 text-xs" /> Baked Insights
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    </>
  );
}