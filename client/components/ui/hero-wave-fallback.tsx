import React from 'react';

const HeroWaveFallback: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 animate-pulse">
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" 
           style={{ animationDuration: '3s' }} />
    </div>
  );
};

export default HeroWaveFallback;
