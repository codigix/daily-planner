/**
 * CODIGIX Executive OS - Planner Deduplication Utility
 * Ensures that syncing or creating tasks never produces duplicate entries,
 * and seamlessly cleans up any legacy duplicates in state or cache.
 */

export const normalizeTaskTitle = (title) => {
  if (!title) return '';
  return String(title)
    .replace(/^\[🥗\s*Diet\]\s*/i, '')
    .trim()
    .toLowerCase();
};

export const normalizeTaskTime = (timeStr) => {
  if (!timeStr) return '';
  // Match start time part before '–' or '-'
  const startPart = String(timeStr).split(/–|-/)[0].trim().toLowerCase();
  return startPart;
};

export const normalizeTaskDate = (dateStr, dayStr) => {
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toDateString().toLowerCase();
      }
    } catch (e) {}
    return String(dateStr).trim().toLowerCase();
  }
  return String(dayStr || '').trim().toLowerCase();
};

export const getTaskFingerprint = (task) => {
  if (!task) return '';
  const title = normalizeTaskTitle(task.title);
  const time = normalizeTaskTime(task.time);
  const date = normalizeTaskDate(task.date, task.targetDay);
  return `${title}__${time}__${date}`;
};

export const getTimelineFingerprint = (item) => {
  if (!item) return '';
  const title = normalizeTaskTitle(item.title);
  const time = normalizeTaskTime(item.time);
  const date = normalizeTaskDate(item.date, '');
  return `${title}__${time}__${date}`;
};

/**
 * Deduplicates an array of planner tasks.
 * Keeps the most informative/complete task if duplicates are found.
 */
export function deduplicateTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  const seenFingerprints = new Set();
  const seenIds = new Set();
  const result = [];

  for (const task of tasks) {
    if (!task || !task.id) continue;
    const strId = String(task.id);
    if (seenIds.has(strId)) continue;

    const fp = getTaskFingerprint(task);
    if (seenFingerprints.has(fp)) {
      continue; // Skip duplicate task
    }

    seenFingerprints.add(fp);
    seenIds.add(strId);
    result.push(task);
  }

  return result;
}

/**
 * Deduplicates an array of schedule timeline items.
 */
export function deduplicateTimeline(timeline) {
  if (!Array.isArray(timeline)) return [];
  const seenFingerprints = new Set();
  const seenIds = new Set();
  const result = [];

  for (const item of timeline) {
    if (!item || !item.id) continue;
    const strId = String(item.id);
    if (seenIds.has(strId)) continue;

    const fp = getTimelineFingerprint(item);
    if (seenFingerprints.has(fp)) {
      continue;
    }

    seenFingerprints.add(fp);
    seenIds.add(strId);
    result.push(item);
  }

  return result;
}

/**
 * Merges newly incoming tasks (e.g. from sync or AI import) into existing tasks,
 * UPDATING existing tasks in place rather than generating duplicates.
 */
export function mergeAndUpdateTasks(existingTasks, incomingTasks) {
  const existingList = Array.isArray(existingTasks) ? [...existingTasks] : [];
  const incomingList = Array.isArray(incomingTasks) ? incomingTasks : [];

  // Index existing tasks by fingerprint
  const fpMap = new Map();
  existingList.forEach((task, index) => {
    const fp = getTaskFingerprint(task);
    if (fp) fpMap.set(fp, index);
  });

  const addedTasks = [];

  for (const incoming of incomingList) {
    const fp = getTaskFingerprint(incoming);
    if (fp && fpMap.has(fp)) {
      // Update existing task with incoming updates while preserving completed status
      const existingIndex = fpMap.get(fp);
      const prev = existingList[existingIndex];
      existingList[existingIndex] = {
        ...prev,
        ...incoming,
        id: prev.id, // Preserve existing ID
        status: prev.status === 'Completed' ? 'Completed' : incoming.status,
        completedDates: { ...(prev.completedDates || {}), ...(incoming.completedDates || {}) },
        notes: incoming.notes || prev.notes,
        checkpoints: (incoming.checkpoints && incoming.checkpoints.length > 0) ? incoming.checkpoints : prev.checkpoints
      };
    } else {
      // Truly new task
      addedTasks.push(incoming);
      if (fp) fpMap.set(fp, existingList.length + addedTasks.length - 1);
    }
  }

  return deduplicateTasks([...addedTasks, ...existingList]);
}
