export interface Candidate {
  id: string;
  name: string;
  photo: string;
  year: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  hasVoted: boolean;
  password?: string;
}

export interface VoteSelection {
  prefects: string[];
}

export const positionLabels: Record<string, string> = {
  prefect: "Prefect",
};

export const candidates: Candidate[] = [];
