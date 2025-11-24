
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GAME_FILES } from './constants';
import { GameItem } from './types';
import GameCard from './components/GameCard';
import { securityService } from './services/obfuscation';
import { Search, Gamepad2, Loader2, X, Play, Dice5, ChevronDown } from 'lucide-react';

// --- DATA PREPARATION ---

const formatGameData = (filename: string): GameItem => {
  let cleanName = filename;
  const lower = filename.toLowerCase();
  if (lower.startsWith('cl')) cleanName = filename.substring(2);
  
  cleanName = cleanName
    .replace(/\.html$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();

  cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    id: filename,
    filename: filename,
    displayName: cleanName,
    category: 'Uncategorized',
    genres: [],
    tags: ['HTML5'],
    description: "" 
  };
};

// --- STARFIELD BACKGROUND COMPONENT ---

const Starfield: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: Array<{
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
            opacity: number;
            pulseSpeed: number;
        }> = [];

        // Purple shades palette
        const colors = [
            '#6366f1', // Indigo 500
            '#8b5cf6', // Violet 500
            '#a855f7', // Purple 500
            '#d8b4fe', // Purple 300
            '#c084fc', // Fuchsia 400
        ];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            const count = Math.floor((canvas.width * canvas.height) / 12000); 
            stars = [];
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.15,
                    speedY: (Math.random() - 0.5) * 0.15,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    opacity: Math.random() * 0.6 + 0.1,
                    pulseSpeed: Math.random() * 0.02 + 0.005
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = star.color;
                ctx.globalAlpha = star.opacity;
                ctx.fill();

                // Move
                star.x += star.speedX;
                star.y += star.speedY;

                // Pulse opacity
                star.opacity += Math.sin(Date.now() * star.pulseSpeed) * 0.005;
                if (star.opacity < 0.1) star.opacity = 0.1;
                if (star.opacity > 0.8) star.opacity = 0.8;

                // Wrap around screen
                if (star.x < 0) star.x = canvas.width;
                if (star.x > canvas.width) star.x = 0;
                if (star.y < 0) star.y = canvas.height;
                if (star.y > canvas.height) star.y = 0;
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-80" />;
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [allGames, setAllGames] = useState<GameItem[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(4); 
  const [isAiLoading, setIsAiLoading] = useState(false); 
  const [hasSearched, setHasSearched] = useState(false); 
  
  // Modal State
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [aiDescription, setAiDescription] = useState<string>("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);

  // Initialize Database
  useEffect(() => {
    setTimeout(() => {
        const items = GAME_FILES.map(formatGameData);
        items.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setAllGames(items);
    }, 0);
  }, []);

  // --- SEARCH HANDLER (GEMINI) ---
  
  const performAiSearch = async (searchTerm?: string) => {
      const query = searchTerm || input;
      if (!query.trim()) return;
      if (searchTerm) setInput(searchTerm);
      
      setIsAiLoading(true);
      setHasSearched(true);
      setFilteredGames([]); 
      setVisibleCount(4); 

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const gameListString = allGames.map(g => g.displayName).join(", ");

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `I have a list of browser games: [${gameListString}]. 
              The user is searching for: "${query}". 
              
              Task:
              1. Analyze the user's request (genre, vibe, or specific name).
              2. Select the top 15-20 best matching games from my list.
              3. Return a JSON object with a property "matches" containing an array of the exact game names found in the list.
              
              If the user asks for "scary", find horror games. If "racing", find car games.`,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          matches: {
                              type: Type.ARRAY,
                              items: { type: Type.STRING }
                          }
                      }
                  }
              }
          });

          const data = JSON.parse(response.text);
          const matches: string[] = data.matches || [];
          const results = allGames.filter(g => matches.includes(g.displayName));
          
          if (results.length === 0) {
               const lower = query.toLowerCase();
               const localResults = allGames.filter(g => g.displayName.toLowerCase().includes(lower));
               setFilteredGames(localResults);
          } else {
               setFilteredGames(results);
          }

      } catch (error) {
          console.error("AI Search Error", error);
          const lower = query.toLowerCase();
          const results = allGames.filter(g => g.displayName.toLowerCase().includes(lower));
          setFilteredGames(results);
      } finally {
          setIsAiLoading(false);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') performAiSearch();
  };

  const handleLoadMore = () => {
      setVisibleCount(prev => prev + 10);
  };

  // --- CONTENT GENERATION HANDLERS (DETAILS) ---

  const generateGameContent = useCallback(async (game: GameItem) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      setLoadingContent(true);
      setAiDescription(""); 
      
      try {
          // Pure text generation - Strictly short description
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Write a game summary for "${game.displayName}". 
              
              Keep it extremely concise. Maximum 40 words. 2 sentences max.
              Focus only on what you do in the game.
              
              Output a JSON object with keys: "description" (string).`,
              config: {
                  responseMimeType: "application/json"
              }
          });
          
          const text = response.text;
          
          try {
            const data = JSON.parse(text);
            setAiDescription(data.description || "Description unavailable.");
          } catch (e) {
             setAiDescription("Details retrieved from secure archives.");
          }

      } catch (error) {
          console.error("Content generation error", error);
          setAiDescription("Offline archives access only.");
      } finally {
          setLoadingContent(false);
      }
  }, []);

  const handleCardClick = (game: GameItem) => {
      setSelectedGame(game);
      generateGameContent(game);
  };

  const handleRandomPick = () => {
      const random = allGames[Math.floor(Math.random() * allGames.length)];
      setSelectedGame(random);
      generateGameContent(random);
  };

  const handleLaunch = async () => {
    if (!selectedGame) return;
    setLaunchingGame(selectedGame.id);

    // Open immediately to bypass popup blocker
    const win = window.open("about:blank", "_blank");

    if (!win) {
        alert("Pop-up blocked. Please allow pop-ups for this site to play.");
        setLaunchingGame(null);
        return;
    }

    try {
        const content = await securityService.fetchResource(selectedGame.filename);
        if (win) {
            win.document.open();
            win.document.write(content);
            win.document.close();
            win.document.title = selectedGame.displayName;
        }
    } catch (error) {
        console.error("Launch failed", error);
        if (win) {
            win.close();
        }
        alert("Failed to load game data.");
    } finally {
        setLaunchingGame(null);
    }
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-200 selection:bg-indigo-500/30 relative overflow-x-hidden bg-black">
      
      {/* Dynamic Starfield Background */}
      <Starfield />
      
      {/* Top Left Brand Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-8 flex justify-between items-start pointer-events-none">
        <div 
            className="pointer-events-auto cursor-pointer flex flex-col group"
            onClick={() => {
                setInput('');
                setFilteredGames([]);
                setHasSearched(false);
            }}
        >
            <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-violet-400 to-indigo-400 bg-[length:200%_auto] group-hover:bg-right transition-all duration-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                GAMESTASH
            </h1>
            <div className="flex items-center gap-2 opacity-50 group-hover:opacity-80 transition-opacity">
                <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-indigo-300">2000+ Games</span>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center w-full min-h-screen pt-32 px-4 pb-20">

          {/* Search Container - Centers vertically when idle, moves up when searched */}
          <div className={`w-full max-w-3xl flex flex-col items-center transition-all duration-700 ease-in-out ${
              hasSearched ? 'mt-0' : 'mt-[15vh]'
          }`}>
              
              {/* Search Bar */}
              <div className="w-full relative group">
                  <div className="absolute -inset-1 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative flex items-center bg-[#0a0b14]/80 backdrop-blur-md rounded-full border border-white/10 shadow-2xl ring-1 ring-white/5">
                      <div className="pl-6 pr-3 text-white/40">
                          {isAiLoading ? (
                              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                          ) : (
                              <Search className="w-6 h-6 group-hover:text-indigo-400 transition-colors" />
                          )}
                      </div>
                      <input 
                          type="text" 
                          className="w-full bg-transparent py-4 text-lg text-white placeholder-white/20 focus:outline-none font-light"
                          placeholder="Search for games..."
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                      />
                      <div className="pr-2 flex items-center gap-2">
                        <button 
                            onClick={handleRandomPick}
                            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-indigo-300 transition-colors"
                            title="Random Game"
                        >
                            <Dice5 className="w-5 h-5" />
                        </button>
                      </div>
                  </div>
              </div>

              {/* Suggestions & Description (Visible when not searching) */}
              {!hasSearched && (
                  <div className="mt-12 flex flex-col items-center w-full animate-fade-in-up">
                      <p className="text-center text-slate-500 mb-8 max-w-lg leading-relaxed text-base font-light">
                          Dive into a curated collection of over 2000 browser games. No downloads, no installation—just instant access to retro classics and modern indie hits.
                      </p>
                      
                      <div className="flex flex-wrap justify-center gap-3">
                          {['Scary games', 'Racing games', 'Classic arcade', 'Puzzle', 'Multiplayer'].map((tag) => (
                              <button
                                  key={tag}
                                  onClick={() => performAiSearch(tag)}
                                  className="px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-sm text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5"
                              >
                                  {tag}
                              </button>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          {/* Results Grid */}
          {hasSearched && (
              <div className="w-full max-w-[1600px] mt-12 animate-fade-in-up">
                  <div className="flex items-center justify-between mb-8 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                            {isAiLoading ? "Consulting Neural Network..." : `${filteredGames.length} Matches Found`}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-white/10 ml-6"></div>
                  </div>
                  
                  {isAiLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                          {[...Array(4)].map((_, i) => (
                              <div key={i} className="aspect-[16/10] rounded-2xl bg-white/5 animate-pulse border border-white/5"></div>
                          ))}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center gap-10">
                          <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                              {filteredGames.slice(0, visibleCount).map((game, idx) => (
                                  <div key={game.id} className="animate-scale-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                      <GameCard 
                                          game={game} 
                                          onPlay={handleCardClick} 
                                          index={idx} 
                                      />
                                  </div>
                              ))}
                          </div>
                          
                          {/* Load More Button */}
                          {visibleCount < filteredGames.length && (
                              <button 
                                onClick={handleLoadMore}
                                className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-all hover:px-8"
                              >
                                <span>Load More Results</span>
                                <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                              </button>
                          )}
                      </div>
                  )}
                  
                  {!isAiLoading && filteredGames.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-white/30">
                          <Gamepad2 className="w-16 h-16 mb-4 opacity-20" />
                          <p className="text-lg font-light">No results found in the stash.</p>
                          <button 
                            onClick={() => {setInput(""); setHasSearched(false);}}
                            className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm underline underline-offset-4"
                          >
                            Return to Home
                          </button>
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* DETAILS MODAL */}
      {selectedGame && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in-up">
              <div 
                className="relative w-full max-w-4xl bg-[#0b0d14] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ring-1 ring-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                  <button 
                      onClick={() => setSelectedGame(null)}
                      className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-black/40 text-white hover:bg-white/20 backdrop-blur-xl border border-white/10 transition-all"
                  >
                      <X className="w-5 h-5" />
                  </button>

                  <div className="p-8 md:p-16 flex flex-col overflow-y-auto">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <Gamepad2 className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                             <h2 className="text-4xl md:text-5xl font-black text-white leading-[0.9] tracking-tight">
                                {selectedGame.displayName}
                            </h2>
                            <span className="text-sm text-slate-500 uppercase tracking-widest font-medium mt-1 block">
                                Browser Native • HTML5
                            </span>
                        </div>
                      </div>

                      <div className="relative bg-white/[0.02] rounded-2xl p-8 border border-white/5 min-h-[100px]">
                          {loadingContent ? (
                              <div className="flex flex-col gap-3">
                                  <div className="h-4 bg-white/5 rounded w-full animate-pulse"></div>
                                  <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse"></div>
                              </div>
                          ) : (
                              <p className="text-lg md:text-xl text-slate-300/90 font-light leading-relaxed tracking-wide whitespace-pre-line">
                                  {aiDescription}
                              </p>
                          )}
                      </div>

                      <div className="mt-10 pt-8 border-t border-white/5">
                          <button 
                              onClick={handleLaunch}
                              className="w-full group relative overflow-hidden rounded-xl bg-white text-black font-black text-lg py-5 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all active:scale-[0.98]"
                          >
                              <div className="flex items-center justify-center gap-3 relative z-10">
                                  <Play className="w-6 h-6 fill-black" />
                                  <span className="tracking-widest">LAUNCH GAME</span>
                              </div>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
