const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDayIndex = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const localDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(localDay.getTime() / MS_PER_DAY);
};

export const getStreakDays = (tasks) => {
  const completedDays = new Set();

  tasks.forEach((task) => {
    if (!task.completedAt) {
      return;
    }
    const dayIndex = toDayIndex(task.completedAt);
    if (dayIndex !== null) {
      completedDays.add(dayIndex);
    }
  });

  if (completedDays.size === 0) {
    return 0;
  }

  const todayIndex = toDayIndex(new Date());
  const dayIndices = Array.from(completedDays);
  const maxDay = Math.max(...dayIndices);

  // Streak only counts if the most recent completion was today or yesterday
  if (todayIndex - maxDay > 1) {
    return 0;
  }

  let currentDay = maxDay;
  let streak = 0;

  while (completedDays.has(currentDay)) {
    streak += 1;
    currentDay -= 1;
  }

  return streak;
};
