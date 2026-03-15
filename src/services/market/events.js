function buildMockEvents() {
  return [
    { time: '09:00', event: 'Produção Industrial', country: 'BR', countryFlag: '🇧🇷', impact: 2, forecast: '0.4%', actual: '0.6%' },
    { time: '09:30', event: 'Non Farm Payroll', country: 'US', countryFlag: '🇺🇸', impact: 3, forecast: '210K', actual: null },
    { time: '11:00', event: 'Oil Inventories', country: 'US', countryFlag: '🇺🇸', impact: 2, forecast: '-2.1M', actual: null },
    { time: '15:00', event: 'Fed Speech', country: 'US', countryFlag: '🇺🇸', impact: 2, forecast: '--', actual: null }
  ];
}

function getEventsSnapshot() {
  const now = new Date();
  const withTime = buildMockEvents().map((event) => {
    const [hours, minutes] = String(event.time || '00:00').split(':').map(Number);
    const eventDate = new Date(now);
    eventDate.setHours(hours || 0, minutes || 0, 0, 0);
    return { ...event, eventDate };
  });

  const upcoming = withTime
    .filter((event) => event.eventDate >= now)
    .sort((a, b) => a.eventDate - b.eventDate)
    .slice(0, 3)
    .map(({ eventDate, ...event }) => event);

  const released = withTime
    .filter((event) => event.eventDate < now)
    .sort((a, b) => b.eventDate - a.eventDate)
    .slice(0, 5)
    .map(({ eventDate, ...event }) => event);

  return { upcoming, released, mode: 'mock' };
}

module.exports = { getEventsSnapshot };
