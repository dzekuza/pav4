import React, { useState, useEffect } from 'react';

const AppLoader: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center z-50">
      <div className="text-center px-4 max-w-md mx-auto">
        {/* Logo with enhanced animation */}
        <div className="mb-8 transform transition-all duration-1000">
          <img 
            src="/ipicklogo.png" 
            alt="ipick.io" 
            className="w-24 h-24 md:w-32 md:h-32 mx-auto animate-pulse drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
            }}
          />
        </div>
        
        {/* Loading text with glow effect */}
        <div className="text-white text-xl md:text-2xl font-bold mb-6 tracking-wider">
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            ipick.io
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Enhanced loading spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-4 border-gray-600 border-t-white"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-4 border-transparent border-t-blue-400" style={{ animationDuration: '1.5s' }}></div>
          </div>
        </div>
        
        {/* Loading message with typing effect */}
        <div className="text-gray-400 text-xs md:text-sm font-medium">
          <span className="inline-block animate-pulse">
            Loading your experience
          </span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.6s' }}>.</span>
        </div>
        
        {/* Progress percentage */}
        <div className="text-gray-500 text-xs mt-2">
          {Math.round(progress)}%
        </div>
        
        {/* Subtle background animation */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AppLoader;
