import React, { useMemo } from 'react';
import { GameItem } from '../types';
import { Gamepad2, Play } from 'lucide-react';

interface GameCardProps {
    game: GameItem;
    onPlay: (game: GameItem) => void;
    index: number;
}

const GameCard: React.FC<GameCardProps> = React.memo(({ game, onPlay, index }) => {
    
    // Generate a subtle gradient accent based on the game name
    const accentColor = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < game.displayName.length; i++) {
            hash = game.displayName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return {
            glow: `hsla(${hue}, 70%, 60%, 0.5)`,
            bg: `hsla(${hue}, 60%, 60%, 0.1)`
        };
    }, [game.displayName]);

    return (
        <div 
            onClick={() => onPlay(game)}
            className="group relative aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 active:scale-95 active:duration-75"
        >
            {/* Dynamic colored glow on hover */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at center, ${accentColor.bg} 0%, transparent 70%)`
                }}
            />
            
            {/* Top sheen effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            {/* Content */}
            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                
                {/* Header Icon */}
                <div className="flex justify-between items-start">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors backdrop-blur-sm">
                         <Gamepad2 className="w-5 h-5 text-white/40 group-hover:text-white/90 transition-colors" />
                    </div>
                    
                    <div 
                        className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 p-1.5 rounded-full bg-white text-black"
                    >
                        <Play className="w-3 h-3 fill-current" />
                    </div>
                </div>

                {/* Text Info */}
                <div className="space-y-1.5">
                    <h3 className="font-bold text-white text-sm leading-tight line-clamp-1 group-hover:text-indigo-200 transition-colors">
                        {game.displayName}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-indigo-400 transition-colors" />
                        <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider group-hover:text-white/60 transition-colors">
                            {game.genres[0] || 'GAME'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default GameCard;