import { llm } from '@livekit/agents';
import { z } from 'zod';

import * as sessionService from '../services/cookingSessionService.js';
import * as ingredientService from '../services/cookingIngredientService.js';
import * as stepService from '../services/cookingStepService.js';
import * as noteService from '../services/cookingNoteService.js';
import { clearTimersFor, scheduleStepTimers } from '../lib/cookingTimers.js';

const QUALITATIVE_AMOUNTS = /^(to taste|a pinch|as needed|for garnish|optional|a dash|a splash)$/i;

function normalizeIngredient(ing) {
  const name = ing.name?.trim() ?? '';
  let quantity = String(ing.quantity ?? '').trim();
  let unit = String(ing.unit ?? '').trim();

  if (QUALITATIVE_AMOUNTS.test(quantity) || QUALITATIVE_AMOUNTS.test(unit)) {
    quantity = quantity || unit;
    unit = '';
  } else if (unit && !quantity) {
    quantity = unit;
    unit = '';
  } else if (quantity && unit && quantity.toLowerCase().includes(unit.toLowerCase())) {
    unit = '';
  }

  return {
    name,
    quantity: quantity || null,
    unit: unit || null,
    sort_order: ing.sort_order ?? 0,
  };
}

function publishAction(room, payload) {
  if (!room) return;
  const data = Buffer.from(JSON.stringify({ type: 'action', ...payload }));
  room.localParticipant
    .publishData(data, { reliable: true })
    .catch((err) => console.error('Failed to publish action:', err));
}

async function runTool(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`[tool] ${name} ok (${Date.now() - start}ms)`);
    return result;
  } catch (err) {
    console.error(
      `[tool] ${name} FAILED (${Date.now() - start}ms):`,
      err.message,
      err.stack,
    );
    return { success: false, error: `Could not complete ${name}: ${err.message}` };
  }
}

function normalizeCollected(collected) {
  if (!Array.isArray(collected)) return [];

  return collected
    .map((item) => {
      if (typeof item === 'string') {
        const answer = item.trim();
        return answer ? { topic: 'preference', answer } : null;
      }

      const topic = (item.topic || item.question || 'preference').trim();
      const answer = item.answer?.trim();
      if (!topic || !answer) return null;
      return { topic, answer };
    })
    .filter(Boolean);
}

// Trigger the agent to speak naturally when a background timer fires.
// Uses session.generateReply so the LLM stays in character and can read the
// chat context, instead of forcing a hard-coded sentence.
function triggerCheckIn(sessionHolder, instructions) {
  const session = sessionHolder?.session;
  if (!session) {
    console.warn('[cooking-timer] no session available for check-in');
    return;
  }
  try {
    session.generateReply({
      instructions,
      allowInterruptions: true,
    });
  } catch (err) {
    console.error('[cooking-timer] generateReply failed:', err);
  }
}

export function buildCookingTools(userId, room, sessionHolder = { session: null }) {
  const stepCheckInOnHalfway = (sessionId) => ({ stepNumber, stepInstruction, durationMinutes }) => {
    publishAction(room, {
      action: 'timer_halfway',
      data: { session_id: sessionId, step_number: stepNumber, duration_minutes: durationMinutes },
    });
    triggerCheckIn(
      sessionHolder,
      `INTERNAL_TIMER_HALFWAY: about ${Math.round(durationMinutes / 2)} minute(s) have passed for step ${stepNumber} ("${stepInstruction}"). Without restarting the recipe, gently check in mid-task — one short, warm sentence + one specific question about what they should be seeing or hearing right now (e.g. bubbles, browning, aroma). Do NOT advance to the next step. If they were in the middle of a side chat, weave the check-in in naturally.`,
    );
  };

  const stepCheckInOnComplete = (sessionId) => ({ stepNumber, stepInstruction, durationMinutes }) => {
    publishAction(room, {
      action: 'timer_complete',
      data: { session_id: sessionId, step_number: stepNumber, duration_minutes: durationMinutes },
    });
    triggerCheckIn(
      sessionHolder,
      `INTERNAL_TIMER_COMPLETE: the ${durationMinutes}-minute timer for step ${stepNumber} ("${stepInstruction}") just finished. Ask the user in one short sentence whether that step is done — be specific (e.g. "is the water at a rolling boil?"). When they confirm with yes, done, ready, finished, or similar, you MUST call complete_step_and_advance with session_id and step_number ${stepNumber}. That tool marks the step done in the database and moves to the next step. Then read the next step aloud if there is one.`,
    );
  };

  function scheduleTimersForStep(sessionId, step) {
    clearTimersFor(sessionId);
    if (step?.durationMinutes && step.durationMinutes > 0) {
      scheduleStepTimers(sessionId, {
        durationMinutes: step.durationMinutes,
        stepNumber: step.stepNumber,
        stepInstruction: step.instruction,
        onHalfway: stepCheckInOnHalfway(sessionId),
        onComplete: stepCheckInOnComplete(sessionId),
      });
    }
  }

  async function finishStepAndMaybeAdvance(session_id, step_number) {
    const result = await stepService.completeStepAndAdvance(session_id, step_number);
    if (result.error) return result;

    clearTimersFor(session_id);

    publishAction(room, {
      action: 'step_completed',
      data: {
        step_number,
        next_step_number: result.next_step_number,
        recipe_finished: result.recipe_finished,
      },
    });

    if (result.next_step) {
      await sessionService.updateCurrentStep(session_id, userId, result.next_step_number);
      scheduleTimersForStep(session_id, result.next_step);
      publishAction(room, {
        action: 'step_advanced',
        data: { step_number: result.next_step_number },
      });
    }

    return {
      success: true,
      completed_step_number: step_number,
      next_step: result.next_step,
      next_step_number: result.next_step_number,
      recipe_finished: result.recipe_finished,
      reminder: result.recipe_finished
        ? 'All steps done — congratulate the user and call complete_cooking_session.'
        : 'Read the next step instruction aloud in one short reply, then STOP.',
    };
  }

  return {
    start_cooking_session: llm.tool({
      description: 'Start a new cooking session for a dish the user wants to cook.',
      parameters: z.object({
        dish_name: z.string().describe('The name of the dish the user wants to cook'),
      }),
      execute: async ({ dish_name }) =>
        runTool('start_cooking_session', async () => {
          const session = await sessionService.createSession(userId, dish_name);
          publishAction(room, { action: 'session_created', data: session });
          return { success: true, session_id: session.id, dish_name: session.dishName };
        }),
    }),

    save_preferences: llm.tool({
      description:
        'Save preferences ONLY after every preference question has been answered. Do not call while still waiting for an answer. Each collected item must have topic and answer strings.',
      parameters: z.object({
        session_id: z.string().describe('The cooking session ID returned by start_cooking_session'),
        question_count: z
          .number()
          .min(1)
          .max(5)
          .optional()
          .describe('How many preference questions you asked'),
        servings: z
          .number()
          .nullish()
          .describe('How many people they are cooking for, if discussed. Omit if unknown.'),
        collected: z
          .array(
            z.union([
              z.string().describe('A preference answer when topic is obvious from context'),
              z.object({
                topic: z
                  .string()
                  .optional()
                  .describe('Short label, e.g. "sauce style", "protein choice"'),
                question: z
                  .string()
                  .optional()
                  .describe('Alias for topic — the question you asked'),
                answer: z.string().describe('What the user said'),
              }),
            ]),
          )
          .min(1)
          .max(5)
          .describe(
            'One entry per answered question, e.g. [{topic:"sauce style",answer:"tomato"},{topic:"protein",answer:"chicken"}]',
          ),
        summary: z
          .string()
          .optional()
          .describe('One natural sentence summarising how to personalise the recipe'),
      }),
      execute: async ({ session_id, question_count, servings, collected, summary }) =>
        runTool('save_preferences', async () => {
          const normalized = normalizeCollected(collected);
          if (normalized.length === 0) {
            return {
              success: false,
              error:
                'No complete preference answers yet. Finish asking your questions and wait for the user to reply before calling save_preferences.',
            };
          }

          const preferences = {
            questionCount: question_count ?? normalized.length,
            servings: servings ?? undefined,
            collected: normalized,
            summary:
              summary ??
              normalized.map(({ topic, answer }) => `${topic}: ${answer}`).join('. '),
          };
          await sessionService.updateSessionPreferences(session_id, userId, preferences);
          await sessionService.confirmSession(session_id, userId);
          publishAction(room, { action: 'preferences_saved', data: { session_id, preferences } });
          return { success: true };
        }),
    }),

    save_recipe: llm.tool({
      description:
        'Save the full recipe — all ingredients and steps — to the database once the user has confirmed they have everything. This also flips the session into cooking mode and tells the UI to display the recipe.',
      parameters: z.object({
        session_id: z.string().describe('The cooking session ID'),
        ingredients: z.array(
          z.object({
            name: z.string().describe('Ingredient name, e.g. "chicken breast"'),
            quantity: z
              .string()
              .describe(
                'Amount: a number ("200", "2", "½") OR qualitative phrase ("to taste", "a pinch"). Never leave ambiguous.',
              ),
            unit: z
              .string()
              .optional()
              .describe(
                'Unit for numeric amounts — required for numbers: g, kg, ml, cup, tbsp, tsp, oz, lb, cloves, slices, etc. Omit for "to taste" / "a pinch".',
              ),
            sort_order: z.number(),
          }),
        ),
        steps: z.array(
          z.object({
            step_number: z.number(),
            instruction: z.string(),
            duration_minutes: z.number().optional(),
          }),
        ),
      }),
      execute: async ({ session_id, ingredients, steps }) =>
        runTool('save_recipe', async () => {
          const normalizedIngredients = ingredients.map(normalizeIngredient);
          for (const ing of normalizedIngredients) {
            if (/^\d+([./]\d+)?$/.test(ing.quantity) && !ing.unit) {
              console.warn(
                `[save_recipe] ingredient "${ing.name}" has quantity "${ing.quantity}" but no unit`,
              );
            }
          }

          const [ingRows, stepRows] = await Promise.all([
            ingredientService.bulkCreateIngredients(session_id, normalizedIngredients),
            stepService.bulkCreateSteps(session_id, steps),
          ]);
          await sessionService.startCooking(session_id, userId);
          await sessionService.setTotalSteps(session_id, userId, stepRows.length);
          publishAction(room, {
            action: 'recipe_saved',
            data: { ingredient_count: ingRows.length, step_count: stepRows.length },
          });
          return {
            success: true,
            ingredient_count: ingRows.length,
            step_count: stepRows.length,
            next_action: 'Call advance_step with step_number 1 next, then read step 1 aloud — one step only.',
          };
        }),
    }),

    mark_ingredient_added: llm.tool({
      description: 'Mark an ingredient as added when the user says they have added it.',
      parameters: z.object({
        session_id: z.string().describe('The cooking session ID'),
        ingredient_name: z.string().describe('Name of the ingredient the user just added'),
      }),
      execute: async ({ session_id, ingredient_name }) =>
        runTool('mark_ingredient_added', async () => {
          const ingredient = await ingredientService.markIngredientAdded(session_id, ingredient_name);
          publishAction(room, { action: 'ingredient_added', data: { ingredient_name } });
          return { success: true, ingredient };
        }),
    }),

    advance_step: llm.tool({
      description:
        'Activate a specific cooking step. Call this ONCE before reading the step aloud, then STOP and let the user act. If the step has a duration_minutes, the backend automatically schedules halfway and completion check-ins — you do not need to track time yourself.',
      parameters: z.object({
        session_id: z.string().describe('The cooking session ID'),
        step_number: z.number().describe('The step number to activate'),
      }),
      execute: async ({ session_id, step_number }) =>
        runTool('advance_step', async () => {
          const currentStep = await stepService.getCurrentStep(session_id);
          if (currentStep && currentStep.status === 'active' && currentStep.stepNumber !== step_number) {
            await stepService.completeStep(session_id, currentStep.stepNumber);
          }

          const step = await stepService.activateStep(session_id, step_number);
          await sessionService.updateCurrentStep(session_id, userId, step_number);
          publishAction(room, { action: 'step_advanced', data: { step_number } });
          scheduleTimersForStep(session_id, step);

          return {
            success: true,
            step,
            has_timer: Boolean(step?.durationMinutes && step.durationMinutes > 0),
            duration_minutes: step?.durationMinutes ?? null,
            reminder:
              step?.durationMinutes && step.durationMinutes > 0
                ? 'After reading this step, STOP. Engage in natural conversation. Do not advance until either the user confirms it is done OR an INTERNAL_TIMER message arrives.'
                : 'Read this step in one short reply, then STOP and wait for the user.',
          };
        }),
    }),

    complete_step_and_advance: llm.tool({
      description:
        'Mark the current step as done in the database and move to the next step. Call this whenever the user confirms a step is finished — including if they said so before the timer ended. This updates the UI checklist and activates the next step automatically.',
      parameters: z.object({
        session_id: z.string().describe('The cooking session ID'),
        step_number: z.number().describe('The step number the user just finished'),
      }),
      execute: async ({ session_id, step_number }) =>
        runTool('complete_step_and_advance', async () => finishStepAndMaybeAdvance(session_id, step_number)),
    }),

    check_progress: llm.tool({
      description:
        'Check the current cooking progress — what has been added, what is pending, what step we are on. Call this when the user sounds lost, asks "what\'s next", or after a long silence.',
      parameters: z.object({
        session_id: z.string().describe('The cooking session ID'),
      }),
      execute: async ({ session_id }) =>
        runTool('check_progress', async () => {
          const [session, pendingIngredients, currentStep] = await Promise.all([
            sessionService.getSessionById(session_id, userId),
            ingredientService.getPendingIngredients(session_id),
            stepService.getCurrentStep(session_id),
          ]);
          const allIngredients = session?.ingredients ?? [];
          const addedCount = allIngredients.filter((i) => i.status === 'added').length;
          publishAction(room, { action: 'progress_checked', data: { session_id } });
          return {
            success: true,
            current_step: session?.currentStep ?? 0,
            total_steps: session?.totalSteps ?? 0,
            current_step_instruction: currentStep?.instruction ?? null,
            current_step_status: currentStep?.status ?? null,
            pending_ingredients: pendingIngredients.map((i) => i.name),
            added_ingredients: addedCount,
            session_status: session?.status,
          };
        }),
    }),

    save_cooking_note: llm.tool({
      description:
        'Save a tip, substitution suggestion, fun fact, or joke related to the dish.',
      parameters: z.object({
        session_id: z.string().describe('The cooking session ID'),
        content: z.string().describe('The note content to save'),
        note_type: z
          .enum(['tip', 'substitution', 'preference', 'warning', 'joke_fact'])
          .describe('Type of note'),
      }),
      execute: async ({ session_id, content, note_type }) =>
        runTool('save_cooking_note', async () => {
          await noteService.addNote(session_id, content, note_type);
          publishAction(room, { action: 'note_saved', data: { note_type, content } });
          return { success: true };
        }),
    }),

    complete_cooking_session: llm.tool({
      description: 'Mark the cooking session as complete when the dish is ready.',
      parameters: z.object({
        session_id: z.string().describe('The cooking session ID'),
      }),
      execute: async ({ session_id }) =>
        runTool('complete_cooking_session', async () => {
          clearTimersFor(session_id);
          await sessionService.completeSession(session_id, userId);
          publishAction(room, { action: 'session_completed', data: { session_id } });
          return { success: true };
        }),
    }),
  };
}
