export function csvCell(value: string | number | null | undefined) {
  const s = String(value ?? "");
  // Quote everything; neutralise leading =,+,-,@ so spreadsheets don't run it as a formula.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
}
