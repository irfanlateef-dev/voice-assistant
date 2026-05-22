/** Combine quantity + unit for display, e.g. "200" + "g" → "200 g" */
export function formatIngredientAmount(ingredient) {
  const qty = ingredient?.quantity?.trim?.() ?? ingredient?.quantity ?? '';
  const unit = ingredient?.unit?.trim?.() ?? ingredient?.unit ?? '';

  if (!qty && !unit) return '';
  if (!unit) return qty;
  if (!qty) return unit;
  if (qty.toLowerCase().includes(unit.toLowerCase())) return qty;

  return `${qty} ${unit}`;
}
