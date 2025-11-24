import React from 'react';
import { Grid, Zap, Shield } from 'lucide-react';

interface SidebarProps {
    activeLetter: string | null;
    onLetterClick: (letter: string | null) => void;
    letters: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeLetter, onLetterClick, letters }) => {
    return (
        <div className="fixed left-0 top-0 z-50 flex h-full w-20 flex-col items-center border-r border-nexus-800/50 bg-nexus-950/80 backdrop-blur-xl shadow-2xl shadow-black/50">
            {/* Brand Logo */}
            <div className="flex h-24 w-full items-center justify-center bg-gradient-to-b from-nexus-900/50 to-transparent">
                <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 rounded-xl bg-nexus-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-nexus-800 to-nexus-900 border border-nexus-700 shadow-inner group-hover:border-nexus-600 transition-colors">
                        <Zap className="h-6 w-6 text-nexus-400 group-hover:text-white transition-colors" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-4 w-full px-4 mb-2">
                 <button 
                    onClick={() => onLetterClick(null)}
                    className={`group relative flex h-12 w-full items-center justify-center rounded-xl transition-all duration-300 ${
                        activeLetter === null 
                        ? 'bg-nexus-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                        : 'text-slate-500 hover:bg-nexus-800 hover:text-white'
                    }`}
                    title="All Games"
                 >
                    <Grid className="h-6 w-6" />
                    {activeLetter === null && <div className="absolute -right-1 top-2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_5px_white]" />}
                 </button>
                 
                 <div className="h-px w-full bg-nexus-800/50"></div>
            </div>

            {/* A-Z Scrollable */}
            <div className="no-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-6 w-full items-center mask-image-b">
                {letters.map((letter) => (
                    <button
                        key={letter}
                        onClick={() => onLetterClick(letter)}
                        className={`h-9 w-9 rounded-lg text-sm font-bold transition-all duration-200 ${
                            activeLetter === letter 
                                ? 'bg-nexus-700 text-white shadow-lg border border-nexus-600 scale-110' 
                                : 'text-slate-600 hover:bg-nexus-800/50 hover:text-nexus-200'
                        }`}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            {/* Footer / Status */}
            <div className="flex h-20 w-full flex-col items-center justify-center gap-2 border-t border-nexus-800/50 bg-nexus-950/50 backdrop-blur-sm">
                 <div className="group relative flex items-center justify-center p-2 rounded-lg hover:bg-nexus-900/50 transition-colors cursor-help">
                     <Shield className="h-5 w-5 text-emerald-600/70 group-hover:text-emerald-500 transition-colors" />
                     <div className="absolute bottom-full mb-2 hidden group-hover:block w-max px-2 py-1 bg-nexus-800 text-[10px] text-white rounded border border-nexus-700">
                        Secure Connection
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default Sidebar;