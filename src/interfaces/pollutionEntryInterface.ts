interface PollutionEntry {
  name?: string;
  city?: string;
  country?: string;
  pollution?: number;
  [key: string]: any;
}

export default PollutionEntry;
