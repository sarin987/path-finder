// List of valid MaterialCommunityIcons names used in the app
// Add more as needed for your use cases
export const VALID_MATERIAL_ICONS = [
  'local-police',
  'local-hospital',
  'local-fire-department',
  'supervisor-account',
  'chat',
  'person',
  'close',
  'expand-less',
  'error',
  'warning',
];

export function getValidIconName(icon) {
  return VALID_MATERIAL_ICONS.includes(icon) ? icon : 'error';
}
