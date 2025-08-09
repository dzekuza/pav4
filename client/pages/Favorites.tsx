import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { SearchHeader } from '../components/SearchHeader';
import { useFavorites } from '../hooks/use-favorites';
import { useToast } from '../hooks/use-toast';
import { Heart, ExternalLink, Star, Package, Truck, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { useAuthModal } from '../hooks/use-auth-modal';
import { AuthModal } from '../components/AuthModal';

const Favorites = () => {
  const { favorites, loading, error, removeFavorite } = useFavorites();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const { modalProps } = useAuthModal({
    title: "Sign in to view favorites",
    description: "Create an account or sign in to view your saved favorites",
    defaultTab: "login",
  });

  const handleRemoveFavorite = async (favoriteId: number, title: string) => {
    try {
      await removeFavorite(favoriteId);
      toast({
        title: "Removed from favorites",
        description: `${title} has been removed from your favorites`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive"
      });
    }
  };

  // Show authentication modal if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden text-white">
        <img src="/pagebg.png" alt="" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100" />
        <SearchHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 text-white/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Sign in to view favorites</h3>
              <p className="text-white/70 mb-4">
                Create an account or sign in to view your saved favorites.
              </p>
              <Button onClick={() => modalProps.onClose()} className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90">
                Sign In
              </Button>
            </CardContent>
          </Card>
          <AuthModal {...modalProps} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden text-white">
        <img src="/pagebg.png" alt="" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100" />
        <SearchHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-white/70">Loading favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden text-white">
        <img src="/pagebg.png" alt="" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100" />
        <SearchHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <p className="text-red-300 mb-4">Error loading favorites: {error}</p>
              <Button onClick={() => window.location.reload()} className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <img src="/pagebg.png" alt="" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100" />
      <SearchHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Favorites</h1>
          <p className="text-white/70">
            {favorites.length === 0 
              ? "You haven't saved any favorites yet." 
              : `You have ${favorites.length} saved favorite${favorites.length === 1 ? '' : 's'}.`
            }
          </p>
        </div>

        {favorites.length === 0 ? (
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 text-white/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No favorites yet</h3>
              <p className="text-white/70 mb-4">
                Start searching for products and add them to your favorites to see them here.
              </p>
              <Button onClick={() => window.location.href = '/'} className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90">
                Start Searching
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="hover:shadow-lg transition-shadow border-white/10 bg-white/5 text-white backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Product image */}
                    <div className="flex-shrink-0">
                      <img 
                        src={favorite.image || "/placeholder.svg"} 
                        alt={favorite.title}
                        className="w-16 h-16 object-cover rounded border border-white/20"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Store/Merchant name */}
                      <p className="text-xs font-medium text-white/80 mb-1 capitalize">
                        {favorite.merchant || favorite.store || 'Unknown Store'}
                      </p>
                      
                      {/* Product title */}
                      <h4 className="font-medium text-sm line-clamp-2 mb-2 text-white">
                        {favorite.title}
                      </h4>
                      
                      {/* Price */}
                      {favorite.price && (
                        <p className="text-lg font-bold text-white">
                          {favorite.price}
                        </p>
                      )}

                      {/* Additional details */}
                      <div className="flex items-center gap-3 text-xs text-white/70 mt-2">
                        {/* Stock status */}
                        {favorite.stock && (
                          <span className={`flex items-center gap-1 ${
                            favorite.stock.toLowerCase().includes('in stock') 
                              ? 'text-green-600' 
                              : 'text-orange-600'
                          }`}>
                            {favorite.stock.toLowerCase().includes('in stock') ? '✅' : '⚠️'} 
                            {favorite.stock}
                          </span>
                        )}

                        {/* Rating */}
                        {favorite.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-yellow-400" />
                            <span>{favorite.rating}</span>
                            {favorite.reviewsCount && (
                              <span className="text-xs">
                                ({favorite.reviewsCount})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Delivery price */}
                        {favorite.deliveryPrice && (
                          <span className="text-xs">
                            🚚 {favorite.deliveryPrice}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      {favorite.details && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {favorite.details}
                        </p>
                      )}

                      {/* Saved date */}
                      <p className="text-xs text-white/60 mt-2">
                        Saved on {new Date(favorite.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-col gap-2">
                      {favorite.url && (
                        <Button asChild size="sm" variant="outline" className="flex-shrink-0 rounded-full bg-white text-black border border-black/10 hover:bg-white/90">
                          <a 
                            href={favorite.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title="View product details"
                            aria-label="View product details"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="sr-only">View product details</span>
                          </a>
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="flex-shrink-0 p-1 h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => handleRemoveFavorite(favorite.id, favorite.title)}
                        title="Remove from favorites"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
