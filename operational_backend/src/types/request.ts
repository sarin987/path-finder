export interface FileParams {
  fileId: string;
  [key: string]: any; // Add index signature to make it compatible with Express
}

export interface LocationParams {
  locationId: string;
  [key: string]: any;
}
