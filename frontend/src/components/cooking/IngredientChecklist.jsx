import { formatIngredientAmount } from '../../lib/formatIngredient.js';

export default function IngredientChecklist({ ingredients, isLoading }) {
  if (isLoading) {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="panel-skeleton" />
        ))}
      </>
    );
  }

  if (!ingredients || ingredients.length === 0) {
    return (
      <p className="panel-empty">
        Ingredients will appear once Grace confirms the recipe.
      </p>
    );
  }

  const pending = ingredients.filter((i) => i.status === 'pending');
  const added = ingredients.filter((i) => i.status === 'added');

  return (
    <>
      {pending.map((ing) => (
        <div key={ing.id} className="ingredient-item">
          <div className="ingredient-item__check" />
          <span className="ingredient-item__name">{ing.name}</span>
          {formatIngredientAmount(ing) && (
            <span className="ingredient-item__qty">{formatIngredientAmount(ing)}</span>
          )}
        </div>
      ))}
      {added.map((ing) => (
        <div key={ing.id} className="ingredient-item ingredient-item--added">
          <div className="ingredient-item__check" />
          <span className="ingredient-item__name">{ing.name}</span>
          {formatIngredientAmount(ing) && (
            <span className="ingredient-item__qty">{formatIngredientAmount(ing)}</span>
          )}
        </div>
      ))}
    </>
  );
}
