export interface Education {
  institution: string;
  degree: string;
  field: string;
  from: number;
  to: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
}

export interface Award {
  id: string;
  year: number;
}

export const EDUCATION: Education = {
  institution: "Electric Power University",
  degree: "Bachelor of Engineering",
  field: "Software Engineering",
  from: 2018,
  to: 2023,
};

export const CERTIFICATIONS: readonly Certification[] = [
  { id: "claude-api", name: "Building with the Claude API", issuer: "Anthropic" },
  { id: "ai-fluency", name: "AI Fluency for Small Businesses", issuer: "Anthropic" },
  {
    id: "genai-thought-partner",
    name: "Use Generative AI as Your Thought Partner",
    issuer: "Coursera",
  },
  {
    id: "landinglens-cv",
    name: "LandingLens Computer Vision Fundamentals",
    issuer: "LandingAI",
  },
];

/** Chỉ năm và id — tên giải nằm trong catalog vì nó cần dịch. */
export const AWARDS: readonly Award[] = [
  { id: "icpc", year: 2021 },
  { id: "informatics-olympiad", year: 2016 },
];
