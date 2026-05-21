import { asc, eq, ilike } from 'drizzle-orm';

import { getDb } from '../db/client.js';
import { cookingIngredients } from '../entity/cookingIngredients.js';

export async function bulkCreateIngredients(sessionId, ingredients) {
  const db = getDb();
  const rows = await db
    .insert(cookingIngredients)
    .values(
      ingredients.map((ing) => ({
        sessionId,
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        sortOrder: ing.sort_order ?? 0,
      })),
    )
    .returning();
  return rows;
}

export async function markIngredientAdded(sessionId, ingredientName) {
  const db = getDb();
  const matches = await db
    .select()
    .from(cookingIngredients)
    .where(ilike(cookingIngredients.name, `%${ingredientName.trim()}%`))
    .limit(1);

  const ingredient = matches.find((i) => i.sessionId === sessionId) ?? matches[0];
  if (!ingredient) return null;

  const [updated] = await db
    .update(cookingIngredients)
    .set({ status: 'added', updatedAt: new Date().toISOString() })
    .where(eq(cookingIngredients.id, ingredient.id))
    .returning();

  return updated;
}

export async function getIngredients(sessionId) {
  const db = getDb();
  return db
    .select()
    .from(cookingIngredients)
    .where(eq(cookingIngredients.sessionId, sessionId))
    .orderBy(asc(cookingIngredients.sortOrder));
}

export async function getPendingIngredients(sessionId) {
  const db = getDb();
  return db
    .select()
    .from(cookingIngredients)
    .where(eq(cookingIngredients.sessionId, sessionId))
    .orderBy(asc(cookingIngredients.sortOrder))
    .then((rows) => rows.filter((r) => r.status === 'pending'));
}
