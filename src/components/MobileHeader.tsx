import React from "react";
import { Menu, X } from "lucide-react";
import Button from "./ui/button.tsx";
import Sheet from "./ui/sheet.tsx";
import Progress from "./ui/progress.tsx";
import { useUserProgress } from "../hooks/useUserProgress.ts";
import { useAuth } from "../hooks/useAuth.ts";
import { Section } from "../types.ts";
import { useUIState } from '../hooks/useUIState.ts';

interface MobileHeaderProps {
  onSectionChange: (section: Section) => void;
  onLogout: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onSectionChange, onLogout }) => {
  const { currentUser: user, logout } = useAuth();
  const { visitedSections } = useUserProgress(user?.username);
  const { isSidebarOpen, toggleSidebar } = useUIState();

  const progress = React.useMemo(() => {
    const sectionCount = Object.keys(Section).length;
    if (!visitedSections || visitedSections.length === 0 || sectionCount === 0) {
        return 0;
    }
    return (visitedSections.length / sectionCount) * 100;
  }, [visitedSections]);

  const handleNavClick = (section: Section) => {
    onSectionChange(section);
    toggleSidebar();
  };

  return (
    <header className="fixed top-0 z-40 flex w-full items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-2 backdrop-blur-md sm:hidden">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={toggleSidebar} aria-label="Menu">
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <Sheet isOpen={isSidebarOpen} onClose={toggleSidebar}>
          <nav className="flex flex-col gap-4">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleNavClick(Section.HOME); }}
              className="text-gray-800 hover:text-primary-600"
            >
              Home
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleNavClick(Section.REFERENCE_LIBRARY); }}
              className="text-gray-800 hover:text-primary-600"
            >
              Gallery
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleNavClick(Section.REFERENCE_LIBRARY); }}
              className="text-gray-800 hover:text-primary-600"
            >
              Case Library
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleNavClick(Section.REFERENCE_LIBRARY); }}
              className="text-gray-800 hover:text-primary-600"
            >
              References
            </a>

            {user && (
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  toggleSidebar();
                }}
              >
                Sign Out
              </Button>
            )}
          </nav>
        </Sheet>

        <h1 className="text-lg font-semibold text-primary-800">
          Pathology Module
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-gray-600 truncate max-w-[100px]">
            {user.username}
          </span>
        )}
        <div className="w-24">
          <Progress value={progress} />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
