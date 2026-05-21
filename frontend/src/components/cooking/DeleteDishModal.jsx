export default function DeleteDishModal({
  isOpen,
  dishName,
  isDeleting,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={isDeleting ? undefined : onCancel}
        aria-hidden="true"
      />

      <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby="delete-dish-title">
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <h2 id="delete-dish-title">Delete dish?</h2>
          <p>
            Delete <strong>{dishName}</strong>? This removes the recipe, steps, and notes permanently.
          </p>

          <div className="modal-actions">
            <button type="button" className="modal-btn" onClick={onCancel} disabled={isDeleting}>
              Cancel
            </button>
            <button
              type="button"
              className="modal-btn modal-btn--danger"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete dish'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
