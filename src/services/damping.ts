/**
 * Gedämpfte Trendfortschreibung (Holt-Damped-Trend-Prinzip): Die tägliche Drift wird
 * nicht unbegrenzt linear fortgeschrieben, sondern klingt mit der Zeit exponentiell
 * ab, sodass die kumulierte Drift gegen einen endlichen Wert konvergiert. Ohne das
 * würde eine kurze, verrauschte Steigung aus wenigen Tagen Historie bei einer
 * 90-Tage-Projektion zu absurd großen Kurszielen hochgerechnet – ein bekanntes
 * Problem reiner linearer Extrapolation.
 *
 * `dampingPerDay` ist der Anteil der Vortages-Drift, der am Folgetag noch "wirkt"
 * (0.9 = 10% Abklingen pro Tag). Für kurze Horizonte (Stunden bis 1-2 Tage) ist der
 * Unterschied zur linearen Fortschreibung minimal, für Wochen/Monate deutlich
 * gedämpfter – realistischer als eine unbegrenzt fortlaufende Gerade.
 */
export function dampedDrift(dailySlope: number, days: number, dampingPerDay = 0.9): number {
  if (days <= 0) return 0
  const k = -Math.log(dampingPerDay)
  return dailySlope * (1 - Math.exp(-k * days)) / k
}
