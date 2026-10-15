// Complaint categories, matching the check constraint on pta.complaints.
export const CATEGORIES = [
  ['academic', 'Teaching or homework'],
  ['transport', 'School bus'],
  ['fees', 'Fees'],
  ['facilities', 'Classrooms, toilets, water'],
  ['safety', 'Safety'],
  ['bullying', 'Bullying'],
  ['staff', 'Staff conduct'],
  ['other', 'Something else'],
] as const;
