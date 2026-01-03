import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

interface FilterState {
  distance: number;
  priceRange: [number, number];
  categories: string[];
  dateRange: 'today' | 'week' | 'month' | 'all';
}

const categories = ['Music', 'Tech', 'Party', 'Art', 'Food', 'Sports'];

export function FiltersModal({ isOpen, onClose, onApply }: FiltersModalProps) {
  const [filters, setFilters] = useState<FilterState>({
    distance: 50,
    priceRange: [0, 500],
    categories: [],
    dateRange: 'all',
  });

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      distance: 50,
      priceRange: [0, 500],
      categories: [],
      dateRange: 'all',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-end justify-center">
      <div className="bg-card rounded-t-3xl border-t border-border w-full max-w-app max-h-[80vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card rounded-t-3xl">
          <h2 className="text-xl font-bold">Filters</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Distance */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="font-medium">Distance</label>
              <span className="text-primary font-bold">{filters.distance}km</span>
            </div>
            <Slider
              value={[filters.distance]}
              onValueChange={(value) => setFilters({ ...filters, distance: value[0] })}
              min={5}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>5km</span>
              <span>100km</span>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="font-medium">Price Range</label>
              <span className="text-primary font-bold">
                N${filters.priceRange[0]} - N${filters.priceRange[1]}
              </span>
            </div>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
              min={0}
              max={1000}
              step={50}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Free</span>
              <span>N$1000+</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="font-medium block mb-4">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    filters.categories.includes(category)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="font-medium block mb-4">When</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'all', label: 'Anytime' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilters({ ...filters, dateRange: option.value as FilterState['dateRange'] })}
                  className={cn(
                    'py-3 rounded-xl text-sm font-medium transition-all border',
                    filters.dateRange === option.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:border-primary'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3 sticky bottom-0 bg-card">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Reset
          </Button>
          <Button className="flex-1 gradient-pro glow-purple" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
