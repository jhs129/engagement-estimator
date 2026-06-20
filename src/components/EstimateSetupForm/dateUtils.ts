export function snapToNextMonday(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dow = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (dow === 1) return dateStr; // already Monday
  const daysToAdd = dow === 0 ? 1 : 8 - dow;
  d.setDate(d.getDate() + daysToAdd);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dy}`;
}
