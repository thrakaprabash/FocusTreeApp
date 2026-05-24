const buildLocalDate = (year, month, day, hour, minute) => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const parseDateInput = (input) => {
  const trimmed = (input || "").trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?$/
  );
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const hour = isoMatch[4] ? Number(isoMatch[4]) : 0;
    const minute = isoMatch[5] ? Number(isoMatch[5]) : 0;
    const date = buildLocalDate(year, month, day, hour, minute);
    return date ? date.toISOString() : null;
  }

  const slashMatch = trimmed.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/
  );
  if (slashMatch) {
    let day = Number(slashMatch[1]);
    let month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const hour = slashMatch[4] ? Number(slashMatch[4]) : 0;
    const minute = slashMatch[5] ? Number(slashMatch[5]) : 0;

    if (day <= 12 && month > 12) {
      [day, month] = [month, day];
    }

    const date = buildLocalDate(year, month, day, hour, minute);
    return date ? date.toISOString() : null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

export const formatDateTime = (iso) => {
  if (!iso) {
    return "No due time";
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "Invalid date";
  }
  return parsed.toLocaleString();
};
