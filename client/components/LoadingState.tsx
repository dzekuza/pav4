import { Search, Loader2 } from "lucide-react";

interface LoadingStateProps {
  title: string;
  description: string;
  step?: number;
}

export function LoadingState({ title, description, step = 1 }: LoadingStateProps) {
  const getProgressWidth = () => {
    switch (step) {
      case 1: return "w-1/3";
      case 2: return "w-2/3";
      case 3: return "w-full";
      default: return "w-1/3";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return "Detecting product details...";
      case 2: return "Searching retailers...";
      case 3: return "Finalizing results...";
      default: return "Processing...";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md mx-auto">
        {/* Animated search icon */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-primary animate-bounce" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-primary animate-pulse' : 'bg-muted'}`}></div>
          <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-primary animate-pulse [animation-delay:0.2s]' : 'bg-muted'}`}></div>
          <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-primary animate-pulse [animation-delay:0.4s]' : 'bg-muted'}`}></div>
        </div>
        
        {/* Animated progress bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div className={`h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500 ${getProgressWidth()}`}></div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          {getStepDescription()}
        </p>
      </div>
    </div>
  );
}