import type { ITeamActivityRecord } from '../../../../../services/activities/activityTypes';
import type { ITeamMember } from '../../../../../services/collaborators/collaboratorTypes';
import { createActivitiesCsv, createDaySummaryCsv } from './activityExport';
import { getDayReviewRows, getReviewPeople } from '../models/adminActivityMetrics';

const record: ITeamActivityRecord = {
  id: 1,
  authorId: 1,
  authorName: 'Ana Quispe',
  authorEmail: 'ana@example.com',
  date: '2024-03-04',
  responsibleUser: 'Ana Quispe',
  activity: 'Revisar; "Sinchi"',
  process: 'Desarrollo',
  project: 'Sinchi',
  module: '',
  hu: 'S/HU',
  hours: 1.5
};

describe('activity CSV export', () => {
  it('adds a UTF-8 BOM and escapes semicolons, quotes, and formula-like values', () => {
    const csv = createActivitiesCsv([{ ...record, activity: '=1+1; "riesgo"' }]);

    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    expect(csv).toContain('"\'=1+1; ""riesgo"""');
    expect(csv).toContain('"1,5"');
  });

  it('exports the selected day and includes group membership in the summary', () => {
    const members: ITeamMember[] = [{ id: 1, displayName: 'Ana Quispe' }, { id: 2, displayName: 'Luis Paredes' }];
    const people = getReviewPeople(members, [record]);
    const rows = getDayReviewRows(people, [record], '2024-03-04');
    const csv = createDaySummaryCsv(rows, '2024-03-04');

    expect(csv).toContain('"2024-03-04";"Ana Quispe"');
    expect(csv).toContain('"SDC-Aplicaciones"');
    expect(csv).toContain('"8"');
  });
});
