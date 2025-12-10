import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  LayoutGrid, 
  Sparkles, 
  ChevronDown, 
  ShoppingBag,
  MoreVertical,
  RotateCcw,
  BarChart3,
  Wand2
} from 'lucide-react';
import { ShoppingItem, PredefinedCategory, CategoryGroup } from './types';
import { parseAndCategorizeItem, reCategorizeItems } from './services/geminiService';
import StatsModal from './components/StatsModal';
import { useTranslation } from './hooks/useTranslation';

const App: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('smartcart-items');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(PredefinedCategory.Other);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Persist items
  useEffect(() => {
    localStorage.setItem('smartcart-items', JSON.stringify(items));
  }, [items]);

  // Derived State: Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    
    // Create a copy and sort: Unchecked first, then by creation date
    const sortedItems = [...items].sort((a, b) => {
      if (a.checked !== b.checked) {
        return a.checked ? 1 : -1; // Unchecked (false) comes before Checked (true)
      }
      return a.createdAt - b.createdAt;
    });

    sortedItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    // Convert to array and sort categories alphabetically (by English key for consistency)
    return Object.keys(groups)
      .sort()
      .map(category => ({
        name: category,
        items: groups[category]
      }));
  }, [items]);

  // Handlers
  const handleAddItem = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    // Manual Add
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: inputValue.trim(),
      category: selectedCategory,
      checked: false,
      createdAt: Date.now()
    };
    
    setItems(prev => [...prev, newItem]);
    setInputValue('');
  };

  const handleSmartAdd = async () => {
    if (!inputValue.trim()) return;
    setIsProcessing(true);
    
    try {
      // Use Gemini to parse natural language or bulk lists
      const result = await parseAndCategorizeItem(inputValue);
      
      const newItems = result.map(r => ({
        id: crypto.randomUUID(),
        name: r.name,
        category: r.category,
        checked: false,
        createdAt: Date.now()
      }));

      setItems(prev => [...prev, ...newItems]);
      setInputValue('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoSort = async () => {
    if (items.length === 0) return;
    setIsSorting(true);
    
    try {
      // Get all unique item names
      const itemNames = Array.from(new Set(items.map(i => i.name))) as string[];
      
      // Get corrected categories from AI
      const categoryMap = await reCategorizeItems(itemNames);
      
      // Update local state
      setItems(prev => prev.map(item => {
        const newCategory = categoryMap[item.name.toLowerCase()];
        if (newCategory) {
          return { ...item, category: newCategory };
        }
        return item;
      }));
    } catch (error) {
      console.error("Auto sort failed", error);
    } finally {
      setIsSorting(false);
    }
  };

  const toggleCheck = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearList = () => {
    if (confirm(t('dialog.clearList'))) {
      setItems([]);
    }
  };
  
  const clearCompleted = () => {
    if (confirm(t('dialog.clearCompleted'))) {
      setItems(prev => prev.filter(item => !item.checked));
    }
  };

  const hasCompletedItems = items.some(i => i.checked);

  return (
    <div className="min-h-screen bg-black text-zinc-50 font-sans selection:bg-indigo-500/30">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-black shadow-2xl sm:border-x sm:border-zinc-800">
        
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-900/20">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                {t('app.title')}
              </h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAutoSort}
                disabled={isSorting || items.length === 0}
                className={`p-2 rounded-full transition-all ${
                  isSorting 
                    ? 'text-purple-400 bg-zinc-900 cursor-wait' 
                    : 'text-zinc-300 hover:text-purple-400 hover:bg-zinc-900'
                }`}
                title={t('action.autoSort')}
              >
                <Wand2 size={20} className={isSorting ? "animate-spin" : ""} />
              </button>
              
              <button 
                onClick={() => setIsStatsOpen(true)}
                className="p-2 text-zinc-300 hover:text-indigo-400 hover:bg-zinc-900 rounded-full transition-all"
                aria-label={t('action.stats')}
              >
                <BarChart3 size={20} />
              </button>

              {hasCompletedItems && (
                <button 
                  onClick={clearCompleted}
                  className="p-2 text-zinc-300 hover:text-red-400 hover:bg-zinc-900 rounded-full transition-all"
                  aria-label={t('action.clearCompleted')}
                  title={t('action.clearCompleted')}
                >
                  <Trash2 size={20} />
                </button>
              )}

              <button 
                onClick={clearList}
                className="p-2 text-zinc-300 hover:text-red-400 hover:bg-zinc-900 rounded-full transition-all"
                aria-label={t('action.clearAll')}
                title={t('action.clearAll')}
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 p-4 pb-32 overflow-y-auto">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 text-zinc-400 space-y-4">
              <ShoppingBag size={64} className="opacity-20" />
              <p className="text-lg font-medium">{t('app.empty.title')}</p>
              <p className="text-sm max-w-xs text-center">{t('app.empty.subtitle')}</p>
            </div>
          )}

          <div className="space-y-6">
            {groupedItems.map((group) => (
              <div key={group.name} className="animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3 text-zinc-300 pl-1">
                  <LayoutGrid size={14} />
                  <h3 className="text-xs font-bold uppercase tracking-wider">{t(`category.${group.name}`)}</h3>
                </div>
                
                <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 overflow-hidden backdrop-blur-sm">
                  {group.items.map((item, index) => (
                    <div 
                      key={item.id}
                      className={`group flex items-center justify-between p-4 border-b border-zinc-800/50 last:border-none hover:bg-zinc-800/40 transition-colors ${item.checked ? 'bg-zinc-900/30' : ''}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button 
                          onClick={() => toggleCheck(item.id)}
                          className={`transition-colors flex-shrink-0 ${item.checked ? 'text-zinc-500' : 'text-zinc-300 hover:text-indigo-400'}`}
                        >
                          {item.checked ? <CheckCircle2 size={22} className="fill-zinc-900" /> : <Circle size={22} />}
                        </button>
                        <span className={`truncate font-medium ${item.checked ? 'line-through text-zinc-400' : 'text-white'}`}>
                          {item.name}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-zinc-400 hover:text-red-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Input Area (Bottom Sticky) */}
        <div className="sticky bottom-0 bg-black border-t border-zinc-800 p-4 pb-6 shadow-[0_-8px_30px_rgba(0,0,0,0.4)] z-50">
          {/* Category Selector (Collapsed mostly) */}
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
            {Object.values(PredefinedCategory).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  selectedCategory === cat 
                    ? 'bg-zinc-100 border-zinc-100 text-black' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {t(`category.${cat}`)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder={t('input.placeholder')}
              className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 placeholder:text-zinc-500"
            />
            
            {/* Action Buttons */}
            {inputValue.trim().length > 0 && (
                <div className="absolute right-2 top-2 bottom-2 flex gap-1">
                   {/* AI Button */}
                   <button
                    onClick={handleSmartAdd}
                    disabled={isProcessing}
                    className="h-full aspect-square flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
                    title={t('input.tooltip.aiSort')}
                  >
                    <Sparkles size={18} className={isProcessing ? "animate-spin" : ""} />
                    {/* Tooltip */}
                    <span className="absolute -top-10 right-0 bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {t('input.tooltip.aiSort')}
                    </span>
                  </button>

                  {/* Standard Add */}
                  <button
                    onClick={() => handleAddItem()}
                    className="h-full aspect-square flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-black rounded-lg shadow-lg transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
            )}
          </div>
          <div className="text-[10px] text-center text-zinc-400 mt-2">
            {t('input.tip')}
          </div>
        </div>

        {/* Stats Modal */}
        <StatsModal 
            isOpen={isStatsOpen} 
            onClose={() => setIsStatsOpen(false)} 
            items={items}
        />
      </div>
    </div>
  );
};

export default App;