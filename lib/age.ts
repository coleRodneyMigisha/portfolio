const BIRTH_YEAR = 2004;
const BIRTH_MONTH_INDEX = 4; // May
const BIRTH_DAY = 27;

// Uganda is UTC+3 all year, with no daylight saving
const UGANDA_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

export function getAge(now: Date): number {
  const ugandaTime = new Date(now.getTime() + UGANDA_UTC_OFFSET_MS);
  const month = ugandaTime.getUTCMonth();
  const hadBirthdayThisYear =
    month > BIRTH_MONTH_INDEX ||
    (month === BIRTH_MONTH_INDEX && ugandaTime.getUTCDate() >= BIRTH_DAY);

  return ugandaTime.getUTCFullYear() - BIRTH_YEAR - (hadBirthdayThisYear ? 0 : 1);
}
