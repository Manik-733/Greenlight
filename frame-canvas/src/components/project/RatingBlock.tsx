import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RatingSummary } from '@/types/bmdb';
import { formatRating } from '@/lib/format';
import { cn } from '@/lib/utils';

interface RatingBlockProps {
  summary: RatingSummary;
  userRating?: number;
  onRate?: (score: number) => void;
  isLoggedIn?: boolean;
}

export function RatingBlock({ summary, userRating, onRate, isLoggedIn = false }: RatingBlockProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [selectedValue, setSelectedValue] = useState<number>(userRating ?? 0);
  const [showInput, setShowInput] = useState(false);

  const displayValue = hoverValue ?? selectedValue;

  const handleRate = () => {
    if (selectedValue > 0 && onRate) {
      onRate(selectedValue);
      setShowInput(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between gap-6">
        {/* Average rating display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary">
                {formatRating(summary.averageRating)}
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.round(summary.averageRating / 2)
                      ? "text-primary fill-primary"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {summary.ratingCount.toLocaleString()} {summary.ratingCount === 1 ? 'rating' : 'ratings'}
            </p>
          </div>
        </div>

        {/* User rating section */}
        <div className="text-right">
          {isLoggedIn ? (
            <>
              {!showInput ? (
                <Button
                  variant="gold-outline"
                  size="sm"
                  onClick={() => setShowInput(true)}
                >
                  {userRating ? `Your rating: ${userRating}` : 'Rate this project'}
                </Button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-end gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Your rating:</span>
                      <span className="text-2xl font-display font-bold text-primary min-w-[2ch] text-center">
                        {displayValue > 0 ? displayValue : '—'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                        <button
                          key={value}
                          onMouseEnter={() => setHoverValue(value)}
                          onMouseLeave={() => setHoverValue(null)}
                          onClick={() => setSelectedValue(value)}
                          className={cn(
                            "w-8 h-8 rounded text-xs font-medium transition-all duration-150",
                            value === selectedValue
                              ? "bg-primary text-primary-foreground"
                              : value <= (hoverValue ?? 0)
                                ? "bg-primary/50 text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                          )}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowInput(false);
                          setSelectedValue(userRating ?? 0);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={handleRate}
                        disabled={selectedValue === 0}
                      >
                        Submit
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              <a href="/login" className="text-primary hover:underline">Sign in</a> to rate
            </p>
          )}
        </div>
      </div>

      {/* Rating distribution */}
      {summary.distribution && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Rating Distribution
          </h4>
          <div className="space-y-2">
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((score) => {
              const count = summary.distribution?.[score] ?? 0;
              const percentage = summary.ratingCount > 0 
                ? (count / summary.ratingCount) * 100 
                : 0;
              
              return (
                <div key={score} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 text-right">{score}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: (10 - score) * 0.05 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
