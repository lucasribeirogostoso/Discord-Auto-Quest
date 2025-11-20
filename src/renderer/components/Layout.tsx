import React from 'react';
import LeftSidebar from './LeftSidebar';
import { useAppStore } from '../stores/appStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { settings } = useAppStore();

  return (
    <div
      className={`flex h-screen w-screen bg-[#09090b] overflow-hidden ${
        settings.theme === 'dark' ? 'dark' : ''
      }`}
    >
      <LeftSidebar />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00f0ff]/5 via-[#09090b]/0 to-[#09090b]/0" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#ff0055]/5 via-[#09090b]/0 to-[#09090b]/0" />
        </div>

        <div className="flex-1 relative z-10 overflow-hidden">
          <main className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
