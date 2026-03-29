/**
 * Penalty Engine — runs every 60 seconds
 * For each active task phase that is overdue, calculates a $5 penalty per 30 min late
 * Penalty is capped at task.budget (freelancer payout cannot go below $0)
 */
const Task = require('../models/Task');

function calcPenalty(minutesLate) {
  if (minutesLate <= 0) return 0;
  return Math.floor(minutesLate / 30) * 5;
}

async function runPenaltyEngine() {
  try {
    const now = new Date();
    const activeTasks = await Task.find({ status: 'in_progress' });

    for (const task of activeTasks) {
      const phaseIdx = task.current_phase_index;
      if (phaseIdx >= task.phases.length) continue;

      const phase = task.phases[phaseIdx];
      if (!phase || phase.status !== 'active' || !phase.started_at) continue;

      const deadlineAt = new Date(phase.started_at.getTime() + phase.deadline_minutes * 60 * 1000);
      if (now <= deadlineAt) continue; // not yet overdue

      const minutesLate = Math.floor((now - deadlineAt) / 60000);
      const newPenalty = calcPenalty(minutesLate);
      const cappedPenalty = Math.min(newPenalty, task.budget);

      if (cappedPenalty !== task.penalty_applied) {
        task.phases[phaseIdx].status = 'overdue';
        task.penalty_applied = cappedPenalty;
        task.markModified('phases');
        await task.save();
        console.log(`[Penalty] Task ${task._id} Phase ${phaseIdx}: ${minutesLate} min late → $${cappedPenalty} deducted`);
      }
    }
  } catch (err) {
    console.error('[Penalty Engine Error]', err.message);
  }
}

function startPenaltyEngine() {
  console.log('[Penalty Engine] Started — checking every 60s');
  setInterval(runPenaltyEngine, 60 * 1000);
  runPenaltyEngine(); // run immediately on start
}

module.exports = { startPenaltyEngine, calcPenalty };
