const BIRTH_YEAR = 2004;
const BIRTH_MONTH_INDEX = 4; // May
const BIRTH_DAY = 27;

export function getAge(now: Date): number {
  const month = now.getMonth();
  const hadBirthdayThisYear =
    month > BIRTH_MONTH_INDEX ||
    (month === BIRTH_MONTH_INDEX && now.getDate() >= BIRTH_DAY);

  return now.getFullYear() - BIRTH_YEAR - (hadBirthdayThisYear ? 0 : 1);
}
