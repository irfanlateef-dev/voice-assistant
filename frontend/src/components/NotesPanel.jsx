export default function NotesPanel({ notes, isLoading }) {
  return (
    <section className="data-panel">
      <div className="data-panel-header">
        <h2>Notes</h2>
        <span className="data-panel-count">{notes.length}</span>
      </div>

      {isLoading && <p className="data-panel-empty">Loading notes…</p>}

      {!isLoading && notes.length === 0 && (
        <p className="data-panel-empty">No notes yet. Try saying “Note: ideas for the project.”</p>
      )}

      <ul className="data-list">
        {notes.map((note) => (
          <li key={note.id} className="data-list-item">
            <span className="data-list-title">{note.content}</span>
            {note.tags?.length > 0 && (
              <span className="data-list-tags">{note.tags.join(', ')}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
