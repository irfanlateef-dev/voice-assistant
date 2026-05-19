export default function TaskPanel({ tasks, isLoading }) {
  return (
    <section className="data-panel">
      <div className="data-panel-header">
        <h2>Tasks</h2>
        <span className="data-panel-count">{tasks.length}</span>
      </div>

      {isLoading && <p className="data-panel-empty">Loading tasks…</p>}

      {!isLoading && tasks.length === 0 && (
        <p className="data-panel-empty">No pending tasks. Try saying “Add a task to call the dentist.”</p>
      )}

      <ul className="data-list">
        {tasks.map((task) => (
          <li key={task.id} className="data-list-item">
            <span className="data-list-title">{task.title}</span>
            {task.description && <span className="data-list-meta">{task.description}</span>}
            {task.dueAt && (
              <span className="data-list-meta">Due {new Date(task.dueAt).toLocaleString()}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
