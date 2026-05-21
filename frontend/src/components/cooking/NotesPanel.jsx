const NOTE_TYPE_LABELS = {
  tip: 'Tip',
  substitution: 'Substitution',
  preference: 'Preference',
  warning: 'Warning',
  joke_fact: 'Fact',
};

export default function NotesPanel({ notes, isLoading }) {
  if (isLoading) {
    return (
      <>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="panel-skeleton" style={{ height: '4rem' }} />
        ))}
      </>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <p className="panel-empty">
        Tips and notes from Grace will appear here during your session.
      </p>
    );
  }

  return (
    <div className="notes-list">
      {notes.map((note) => {
        const type = note.noteType ?? 'tip';
        return (
          <div key={note.id} className="note-card">
            <span className={`note-card__badge note-card__badge--${type}`}>
              {NOTE_TYPE_LABELS[type] ?? type}
            </span>
            <p className="note-card__text">{note.content}</p>
          </div>
        );
      })}
    </div>
  );
}
