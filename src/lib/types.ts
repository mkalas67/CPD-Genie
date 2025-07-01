export type Generation = {
  id: string;
  aims: string[];
  skills: string[];
  outcomes: string[];
  cpdHours: number;
  context?: string;
  docCount: number;
  description?: string;
  createdAt: Date;
  ip?: string;
};
