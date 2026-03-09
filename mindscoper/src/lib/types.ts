export interface Entity {
  id: string;
  label: string;
  type:
    | "symptom"
    | "behavior"
    | "emotion"
    | "event"
    | "trigger"
    | "outcome"
    | "patient";
}

export interface Edge {
  source: string;
  target: string;
  label: string;
}

export interface StoryFlowStep {
  stage: "Life Event" | "Trigger" | "Emotion" | "Behavior" | "Outcome";
  description: string;
}

export interface AnalysisResult {
  summary: string;
  status: "Low concern" | "Moderate concern" | "High concern" | "Critical";
  wellnessScore: number;
  primaryPattern: string;
  suggestedFollowUp: string;
  entities: Entity[];
  edges: Edge[];
  possibleConditionHints: string[];
  temporalPattern: string;
  storyFlow: StoryFlowStep[];
  therapeuticTechniques?: string[];
  riskFactors?: string[];
  protectiveFactors?: string[];
  sessionTopics?: string[];
  patientInsight?: string;
}

export interface Session {
  id: string;
  timestamp: number;
  transcript: string;
  analysis: AnalysisResult;
  inputMethod: "recording" | "upload";
  fileName?: string;
}
