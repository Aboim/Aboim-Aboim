import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ShoppingItem, ChartData } from '../types';
import { X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#64748b'];

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, items }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const totalItems = items.length;
  const completedItems = items.filter(i => i.checked).length;
  const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  // Group for chart
  const categoryCounts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data: ChartData[] = Object.keys(categoryCounts).map((key, index) => ({
    name: t(`category.${key}`), // Localize category name
    value: categoryCounts[key],
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{t('stats.title')}</h2>
          <button onClick={onClose} className="text-zinc-300 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <div className="flex justify-between text-sm text-zinc-300 mb-2">
              <span>{t('stats.progress')}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5">
              <div 
                className="bg-zinc-100 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-3 text-center text-sm font-medium text-zinc-200">
              {t('stats.collected', { completed: completedItems, total: totalItems })}
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 w-full">
             {data.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={data}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {data.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                   />
                   <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-zinc-400">
                 {t('stats.noData')}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;