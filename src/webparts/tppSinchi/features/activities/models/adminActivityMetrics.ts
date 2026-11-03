import type { ITeamMember } from '../../../../../services/collaborators/collaboratorTypes';
import type { ITeamActivityRecord } from '../../../../../services/activities/activityTypes';
import { getLimaDateOnly } from '../../../../../services/activities/activityDate';
import { DAILY_HOURS_TARGET, getActivityDayStatus } from './activityStatus';
import { getCalendarDays, isWorkDay } from '../utils/activityCalendar';

export interface IReviewPerson extends ITeamMember {
  isInTeamGroup: boolean;
}

export interface IDayReviewRow {
  person: IReviewPerson;
  activities: ITeamActivityRecord[];
  hours: number;
  status: ReturnType<typeof getActivityDayStatus>;
}

export interface IMonthReviewRow {
  person: IReviewPerson;
  hours: number;
  hoursByDate: Record<string, number>;
  expectedHours: number;
  expectedDays: number;
  completeDays: number;
  pendingDays: string[];
  percentage: number;
  status: 'complete' | 'pending';
}

export interface IDayReviewSummary {
  complete: number;
  incomplete: number;
  missing: number;
  hours: number;
  expectedHours: number;
}

export interface IMonthReviewSummary {
  onTrack: number;
  withPending: number;
  averagePercentage: number;
  hours: number;
  expectedHours: number;
}

function getNormalizedEmail(value?: string): string {
  return value?.trim().toLocaleLowerCase('en-US') || '';
}

export function getActivityPersonId(
  activity: ITeamActivityRecord,
  people: ITeamMember[]
): number | string {
  const authorEmail = getNormalizedEmail(activity.authorEmail);
  if (authorEmail) {
    const emailMatch = people.find(person => getNormalizedEmail(person.email) === authorEmail);
    if (emailMatch) {
      return emailMatch.id;
    }
  }

  const sharePointIdMatch = people.find(person =>
    typeof person.id === 'number' && person.id === activity.authorId
  );
  return sharePointIdMatch?.id ?? activity.authorId;
}

export function isActivityForPerson(activity: ITeamActivityRecord, person: ITeamMember): boolean {
  const authorEmail = getNormalizedEmail(activity.authorEmail);
  const personEmail = getNormalizedEmail(person.email);
  if (authorEmail && personEmail) {
    return authorEmail === personEmail;
  }
  return typeof person.id === 'number' && activity.authorId === person.id;
}

export function getReviewPeople(members: ITeamMember[], activities: ITeamActivityRecord[]): IReviewPerson[] {
  const people = new Map<number | string, IReviewPerson>();
  members.forEach(member => people.set(member.id, { ...member, isInTeamGroup: true }));
  activities.forEach(activity => {
    const personId = getActivityPersonId(activity, Array.from(people.values()));
    if (!people.has(personId)) {
      people.set(personId, {
        id: personId,
        displayName: activity.authorName,
        email: activity.authorEmail,
        isInTeamGroup: false
      });
    }
  });
  return Array.from(people.values()).sort((left, right) => left.displayName.localeCompare(right.displayName, 'es'));
}

export function getDayReviewRows(
  people: IReviewPerson[],
  activities: ITeamActivityRecord[],
  date: string
): IDayReviewRow[] {
  const activitiesByAuthor = new Map<number | string, ITeamActivityRecord[]>();
  activities.forEach(activity => {
    if (activity.date === date) {
      const authorId = getActivityPersonId(activity, people);
      const authorActivities = activitiesByAuthor.get(authorId) || [];
      authorActivities.push(activity);
      activitiesByAuthor.set(authorId, authorActivities);
    }
  });

  return people.map(person => {
    const personActivities = activitiesByAuthor.get(person.id) || [];
    const hours = personActivities.reduce((total, activity) => total + activity.hours, 0);
    return {
      person,
      activities: personActivities,
      hours,
      status: getActivityDayStatus(hours, isWorkDay(date))
    };
  });
}

export function getDayReviewSummary(rows: IDayReviewRow[], rosterAvailable: boolean, date: string): IDayReviewSummary {
  const workday = isWorkDay(date);
  return {
    complete: rows.filter(row => row.person.isInTeamGroup && row.status.key === 'complete').length,
    incomplete: rows.filter(row => row.person.isInTeamGroup && row.status.key === 'incomplete').length,
    missing: rosterAvailable
      ? rows.filter(row => row.person.isInTeamGroup && row.status.key === 'missing').length
      : 0,
    hours: rows
      .filter(row => !rosterAvailable || row.person.isInTeamGroup)
      .reduce((total, row) => total + row.hours, 0),
    expectedHours: workday && rosterAvailable
      ? rows.filter(row => row.person.isInTeamGroup).length * DAILY_HOURS_TARGET
      : 0
  };
}

export function getMonthReviewRows(
  people: IReviewPerson[],
  activities: ITeamActivityRecord[],
  date: string
): IMonthReviewRow[] {
  const today = getLimaDateOnly();
  const days = getCalendarDays(date).filter((day): day is string => !!day);
  const activitiesByAuthorDate = new Map<string, number>();
  activities.forEach(activity => {
    const key = JSON.stringify([getActivityPersonId(activity, people), activity.date]);
    activitiesByAuthorDate.set(key, (activitiesByAuthorDate.get(key) || 0) + activity.hours);
  });

  return people.map(person => {
    let expectedDays = 0;
    let completeDays = 0;
    let hours = 0;
    let completedHours = 0;
    const hoursByDate: Record<string, number> = {};
    const pendingDays: string[] = [];

    days.forEach(day => {
      const dayHours = activitiesByAuthorDate.get(JSON.stringify([person.id, day])) || 0;
      hoursByDate[day] = dayHours;
      hours += dayHours;
      if (day > today || !isWorkDay(day)) {
        return;
      }
      expectedDays++;
      completedHours += Math.min(dayHours, DAILY_HOURS_TARGET);
      if (dayHours >= DAILY_HOURS_TARGET) {
        completeDays++;
      } else if (day < today) {
        pendingDays.push(day);
      }
    });

    const expectedHours = expectedDays * DAILY_HOURS_TARGET;
    const percentage = expectedHours ? completedHours / expectedHours : 1;
    return {
      person,
      hours,
      hoursByDate,
      expectedHours,
      expectedDays,
      completeDays,
      pendingDays,
      percentage,
      status: pendingDays.length ? 'pending' : 'complete'
    };
  });
}

export function getMonthReviewSummary(rows: IMonthReviewRow[], rosterAvailable: boolean): IMonthReviewSummary {
  const teamRows = rows.filter(row => row.person.isInTeamGroup);
  const hours = rows
    .filter(row => !rosterAvailable || row.person.isInTeamGroup)
    .reduce((total, row) => total + row.hours, 0);
  const expectedHours = teamRows.reduce((total, row) => total + row.expectedHours, 0);
  return {
    onTrack: rosterAvailable ? teamRows.filter(row => row.status === 'complete').length : 0,
    withPending: rosterAvailable ? teamRows.filter(row => row.status === 'pending').length : 0,
    averagePercentage: rosterAvailable && teamRows.length
      ? teamRows.reduce((total, row) => total + row.percentage, 0) / teamRows.length
      : 0,
    hours,
    expectedHours: rosterAvailable ? expectedHours : 0
  };
}
