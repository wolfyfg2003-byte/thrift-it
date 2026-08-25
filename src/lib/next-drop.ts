/** Next Sunday 20:00 GST (Asia/Dubai, UTC+4). Demonstration drop time. */
export function nextSundayDropMs(now = Date.now()): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dubai",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(now))
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    parts.weekday,
  );
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  let addDays = (7 - dayIndex) % 7;
  if (addDays === 0 && (hour > 20 || (hour === 20 && minute > 0))) {
    addDays = 7;
  }

  const stamp = `${parts.year}-${parts.month}-${parts.day}T20:00:00+04:00`;
  return Date.parse(stamp) + addDays * 24 * 60 * 60 * 1000;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remH = hours % 24;
    return `${String(days).padStart(2, "0")}:${String(remH).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
