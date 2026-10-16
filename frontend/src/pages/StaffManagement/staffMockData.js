// LOCAL MOCK DATA for the Staff Management screens. Nothing here comes from a server or a database.
// The first rows copy the Figma (names, roles, shifts, statuses); the rest are generated so 45 staff exist, as the cards say.
export const PAGE_SIZE = 7;

export const ROLES = ['Cashier', 'Manager', 'Waiter', 'Kitchen Staff', 'Supervisor', 'Chef', 'Cleaner'];
export const TEAMS = ['Management', 'Service', 'Cleaning', 'Cooking'];
export const SHIFTS = ['Morning', 'Evening', 'Night'];
export const GENDERS = ['Male', 'Female', 'Others'];
export const EMPLOYMENT_TYPES = ['Fulltime', 'Part time', 'Contract', 'Intern'];
export const SALARY_TYPES = ['Monthly', 'Daily', 'Hourly'];
export const PAYMENT_METHODS = ['Cash', 'Bank Transfer'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// PENDING: "Staff on Duty" and "Active Shift" need attendance and shift data that does not exist yet, so they are fixed demo values.
export const STAFF_ON_DUTY = 22;
export const ACTIVE_SHIFT = 'EVENING';

export const DOCUMENT_SLOTS = [
  { key: 'cv', label: 'CV/Resume', viewLabel: 'CV/Resume', hint: 'PDF, DOC (Max 5MB)', accept: '.pdf,.doc,.docx', types: ['pdf', 'doc', 'docx'] },
  { key: 'idCopy', label: 'ID Copy', viewLabel: 'NIC Copy', hint: 'JPG, PNG, PDF (Max 5MB)', accept: '.jpg,.jpeg,.png,.pdf', types: ['jpg', 'jpeg', 'png', 'pdf'] },
  { key: 'agreement', label: 'Employment Agreement', viewLabel: 'Employment Contract', hint: 'Signed PDF (Max 5MB)', accept: '.pdf', types: ['pdf'] },
];
export const MAX_DOC_BYTES = 5 * 1024 * 1024;

const pad = (n, size) => String(n).padStart(size, '0');
export const staffCode = (n) => `STF${pad(n, 4)}`; // STF0012: the auto-generated preview in the Add Staff form
export const staffTag = (n) => `#STF${n}`; // #STF12: how the list and the detail page show it

export const formatMoney = (n) => Number(String(n).replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const blankStaff = () => ({
  name: '', gender: '', avatar: null, imageName: '', phone: '', email: '', nic: '', dob: '', address: '',
  emergency: { name: '', relationship: '', phone: '' },
  joinDate: '', role: '', team: '', employmentType: '', active: true, inactiveReason: '',
  shift: '', workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hoursPerWeek: '',
  username: '', password: '',
  salary: { type: 'Monthly', basic: '', overtime: false, otRate: '', method: '', bank: '', account: '' },
  epf: { allowed: false, employerNumber: '', employeeNumber: '', employeeRate: 8, employerRate: 12, etfRate: 3 },
  docs: { cv: null, idCopy: null, agreement: null },
});

// The first seven match the Figma list. The roles/teams of the later ones are only for the demo.
const SEED = [
  ['Michel Brown', 'Male', 'Manager', 'Management', 'Morning', true],
  ['James Wilson', 'Male', 'Waiter', 'Service', 'Night', false],
  ['Sarah Jenkins', 'Female', 'Supervisor', 'Management', 'Evening', true],
  ['David Anderson', 'Male', 'Manager', 'Management', 'Morning', true],
  ['Emily Davis', 'Female', 'Cleaner', 'Cleaning', 'Morning', true],
  ['Olivia Perera', 'Female', 'Chef', 'Cooking', 'Morning', true],
  ['Nimal Fernando', 'Male', 'Manager', 'Service', 'Morning', true],
];
const FIRST = ['Kamal', 'Nadeesha', 'Ruwan', 'Ishara', 'Tharindu', 'Sanduni', 'Pasan', 'Dilini', 'Chamara', 'Hasini', 'Lahiru', 'Anjali', 'Kasun', 'Maduri', 'Sahan', 'Thilini', 'Nuwan', 'Piumi'];
const LAST = ['Silva', 'Jayasinghe', 'Wickramasinghe', 'Bandara', 'Rajapaksa', 'Gunawardena', 'Herath', 'Dissanayake', 'Senanayake', 'Weerasinghe'];
const INACTIVE_AT = [11, 19, 30, 41]; // plus James Wilson = 5 inactive staff, as on the card

function makeStaff(n, [name, gender, role, team, shift, active]) {
  const [first, last] = name.split(' ');
  const base = blankStaff();
  const phone = `07${n % 3} ${pad(100 + ((n * 37) % 900), 3)} ${pad(1000 + ((n * 137) % 9000), 4)}`;
  return {
    ...base,
    id: n, code: staffCode(n), name, gender, role, team, shift, active,
    inactiveReason: active ? '' : 'Staff have to submit required documents.',
    email: `${first}.${last}@paipos.com`.toLowerCase(),
    phone,
    nic: `199${n % 10}${pad(2000 + n * 11, 4)}${pad(3000 + n * 7, 4)}`,
    dob: `${pad(1 + (n % 28), 2)}/${pad(1 + (n % 12), 2)}/${1990 + (n % 10)}`,
    address: '478, Meekanuwa Road, Kandy 20000, Sri Lanka',
    emergency: { name: 'Robert', relationship: 'Brother', phone: '071 12 34 567' },
    joinDate: `${pad(1 + (n % 28), 2)}/${pad(1 + (n % 12), 2)}/2025`,
    employmentType: EMPLOYMENT_TYPES[n % 2],
    hoursPerWeek: '40', username: `${first}${n}`.toLowerCase(),
    salary: { type: 'Monthly', basic: 60000, overtime: n % 2 === 0, otRate: n % 2 === 0 ? 150 : '', method: 'Bank Transfer', bank: 'BOC - Jaffna', account: `3500 4002 ${pad(6000 + n, 4)}` },
    epf: { ...base.epf, allowed: true, employerNumber: '123456/A', employeeNumber: pad(700 + n, 5) },
    lastLogin: { date: '20.05.2026', time: '09:38 AM' },
  };
}

export const INITIAL_STAFF = Array.from({ length: 45 }, (_, i) => {
  const n = i + 1;
  if (i < SEED.length) return makeStaff(n, SEED[i]);
  const name = `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`;
  const gender = i % 2 ? 'Female' : 'Male';
  return makeStaff(n, [name, gender, ROLES[i % ROLES.length], TEAMS[i % TEAMS.length], SHIFTS[i % SHIFTS.length], !INACTIVE_AT.includes(n)]);
});

export const nextStaffNumber = (list) => Math.max(0, ...list.map((s) => s.id)) + 1;
