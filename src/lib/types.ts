export type Generation = {
  id: string;
  aims: string[];
  skills: string[];
  outcomes: string[];
  cpdEstimate: string;
  context?: string;
  docCount: number;
  description?: string;
  createdAt: Date;
  ip?: string;
};
