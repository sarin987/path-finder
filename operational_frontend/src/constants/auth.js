export const ROLES = [
  { label: 'User', value: 'user', requiresBatchId: false },
  { label: 'Police Officer', value: 'police', requiresBatchId: true },
  { label: 'Hospital Staff', value: 'hospital', requiresBatchId: true },
  { label: 'Ambulance Driver', value: 'ambulance', requiresBatchId: true }
];

export const ROLE_ROUTES = {
  user: 'UserDashboard',
  police: 'PoliceDashboard',
  hospital: 'HospitalDashboard',
  ambulance: 'AmbulanceDashboard'
};