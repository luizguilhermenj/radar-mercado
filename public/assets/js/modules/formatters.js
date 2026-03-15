export function formatNumber(value, digits = 2) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '--';
  return parsed.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

export function formatPercent(value, digits = 2) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '--';
  const signal = parsed > 0 ? '+' : '';
  return `${signal}${parsed.toFixed(digits)}%`;
}

export function classifyValue(value, reverse = false) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed === 0) return 'neutral';
  if (reverse) return parsed < 0 ? 'pos' : 'neg';
  return parsed > 0 ? 'pos' : 'neg';
}
