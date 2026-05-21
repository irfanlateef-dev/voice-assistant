import { useState } from 'react';
import { X } from 'lucide-react';

import IngredientChecklist from './IngredientChecklist.jsx';
import StepTracker from './StepTracker.jsx';

export default function RecipeModal({
  isOpen,
  onClose,
  ingredients,
  steps,
  currentStep,
  isLoading,
}) {
  const [tab, setTab] = useState('ingredients');

  if (!isOpen) return null;

  const addedCount = ingredients.filter((i) => i.status === 'added').length;
  const doneCount = steps.filter((s) => s.status === 'done').length;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85vh] rounded-t-2xl border-t border-white/[0.1] shadow-2xl"
        style={{ background: 'rgba(10,15,30,0.98)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Recipe progress"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white m-0">Recipe progress</h2>
            <p className="text-xs text-slate-400 mt-1 mb-0">
              {ingredients.length > 0
                ? `${addedCount}/${ingredients.length} ingredients · ${doneCount}/${steps.length} steps`
                : 'Recipe will appear once Grace saves it'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close recipe"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setTab('ingredients')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === 'ingredients'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            Ingredients
            {ingredients.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{addedCount}/{ingredients.length}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('steps')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === 'steps'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            Steps
            {steps.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{doneCount}/{steps.length}</span>
            )}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4">
          {tab === 'ingredients' ? (
            <IngredientChecklist ingredients={ingredients} isLoading={isLoading} />
          ) : (
            <StepTracker steps={steps} currentStep={currentStep} isLoading={isLoading} />
          )}
        </div>
      </div>
    </>
  );
}
