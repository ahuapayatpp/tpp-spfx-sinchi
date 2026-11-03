import type { ITeamActivityRecord } from '../../../../../services/activities/activityTypes';
import type { ITeamMember } from '../../../../../services/collaborators/collaboratorTypes';
import {
  getDayReviewRows,
  getDayReviewSummary,
  getMonthReviewRows,
  getMonthReviewSummary,
  getReviewPeople,
  isActivityForPerson
} from './adminActivityMetrics';

const MEMBERS: ITeamMember[] = [
  { id: 1, displayName: 'Ana Quispe', email: 'ana@example.com' },
  { id: 2, displayName: 'Luis Paredes', email: 'luis@example.com' }
];

function activity(id: number, authorId: number, authorName: string, date: string, hours: number): ITeamActivityRecord {
  return {
    id,
    authorId,
    authorName,
    authorEmail: `${authorName.toLocaleLowerCase().replace(' ', '.')}@example.com`,
    date,
    responsibleUser: authorName,
    activity: `Actividad ${id}`,
    process: 'Desarrollo',
    project: 'Sinchi',
    module: '',
    hu: 'S/HU',
    hours
  };
}

describe('admin activity metrics', () => {
  it('includes group members without records and marks authors outside the group', () => {
    const records = [activity(1, 3, 'Persona externa', '2024-03-01', 1)];
    const people = getReviewPeople(MEMBERS, records);

    expect(people.map(person => [person.displayName, person.isInTeamGroup])).toEqual([
      ['Ana Quispe', true],
      ['Luis Paredes', true],
      ['Persona externa', false]
    ]);
  });

  it('associates Graph members with SharePoint activity authors by email, not Graph ID', () => {
    const graphMember: ITeamMember = {
      id: 'a1f2e965-75d1-4385-9d51-e8015d90f321',
      displayName: 'Ana Quispe',
      email: 'ana@example.com'
    };
    const record = activity(1, 118, 'Ana Quispe', '2024-03-04', 8);
    record.authorEmail = 'ANA@example.com';
    const people = getReviewPeople([graphMember], [record]);
    const rows = getDayReviewRows(people, [record], '2024-03-04');
    const monthRows = getMonthReviewRows(people, [record], '2024-03-15');

    expect(people).toHaveLength(1);
    expect(people[0].id).toBe(graphMember.id);
    expect(rows[0].hours).toBe(8);
    expect(monthRows[0].hours).toBe(8);
    expect(isActivityForPerson(record, graphMember)).toBe(true);
  });

  it('calculates daily states and withholds missing counts if the roster is unavailable', () => {
    const records = [activity(1, 1, 'Ana Quispe', '2024-03-04', 8), activity(2, 3, 'Persona externa', '2024-03-04', 2)];
    const people = getReviewPeople(MEMBERS, records);
    const rows = getDayReviewRows(people, records, '2024-03-04');
    const summary = getDayReviewSummary(rows, true, '2024-03-04');
    const partialSummary = getDayReviewSummary(rows, false, '2024-03-04');

    expect(rows.find(row => row.person.id === 1)?.status.key).toBe('complete');
    expect(rows.find(row => row.person.id === 2)?.status.key).toBe('missing');
    expect(summary).toEqual({ complete: 1, incomplete: 0, missing: 1, hours: 8, expectedHours: 16 });
    expect(partialSummary.missing).toBe(0);
    expect(partialSummary.expectedHours).toBe(0);
    expect(partialSummary.hours).toBe(10);
  });

  it('treats Saturday and Sunday as non-working days', () => {
    const people = getReviewPeople(MEMBERS, []);
    const rows = getDayReviewRows(people, [], '2024-03-02');

    expect(rows.every(row => row.status.key === 'nonWorkday')).toBe(true);
    expect(getDayReviewSummary(rows, true, '2024-03-02').expectedHours).toBe(0);
  });

  it('calculates monthly completed days, overdue days, and compliance', () => {
    const records = [
      activity(1, 1, 'Ana Quispe', '2024-03-01', 8),
      activity(2, 1, 'Ana Quispe', '2024-03-04', 4)
    ];
    const people = getReviewPeople(MEMBERS, records);
    const rows = getMonthReviewRows(people, records, '2024-03-15');
    const ana = rows.find(row => row.person.id === 1);
    const luis = rows.find(row => row.person.id === 2);

    expect(ana?.expectedDays).toBe(21);
    expect(ana?.completeDays).toBe(1);
    expect(ana?.pendingDays).toContain('2024-03-04');
    expect(ana?.hours).toBe(12);
    expect(ana?.percentage).toBeCloseTo(12 / (21 * 8));
    expect(luis?.pendingDays.length).toBe(21);
    expect(getMonthReviewSummary(rows, true).withPending).toBe(2);
  });
});
