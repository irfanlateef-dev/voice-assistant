import { X } from 'lucide-react';

const NOTE_TYPE_LABELS = {
  tip: 'Tip',
  substitution: 'Substitution',
  preference: 'Preference',
  warning: 'Warning',
  joke_fact: 'Fact & Joke',
};

const NOTE_TYPE_COLORS = {
  tip: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  substitution: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  preference: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  warning: 'bg-red-500/20 text-red-300 border-red-500/30',
  joke_fact: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const NOTE_TYPE_EMOJI = {
  tip: '💡',
  substitution: '🔄',
  preference: '⚙️',
  warning: '⚠️',
  joke_fact: '😄',
};

export default function NotesDrawer({ notes, isOpen, onClose }) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'rgba(10,15,30,0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
        aria-label="Cooking notes"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <h2 className="text-base font-semibold text-white m-0">Session Notes</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close notes"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {!notes || notes.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center mt-8">
              Tips, facts, and jokes from Grace will appear here during cooking.
            </p>
          ) : (
            notes.map((note) => {
              const typeClass = NOTE_TYPE_COLORS[note.noteType] ?? NOTE_TYPE_COLORS.tip;
              const typeLabel = NOTE_TYPE_LABELS[note.noteType] ?? note.noteType;
              const emoji = NOTE_TYPE_EMOJI[note.noteType] ?? '💡';

              return (
                <div
                  key={note.id}
                  className="flex flex-col gap-2 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{emoji}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeClass}`}
                    >
                      {typeLabel}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed m-0">{note.content}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
