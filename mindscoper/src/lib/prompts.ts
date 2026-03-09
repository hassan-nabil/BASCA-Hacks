export const TRANSCRIPTION_PROMPT = `You are a professional medical transcriptionist. 
Transcribe the following therapy session audio accurately and completely.
Format the transcript as a conversation, identifying speakers as "Therapist" and "Patient" where possible.
If you cannot distinguish speakers, just transcribe the content as-is.
Do NOT add any commentary or analysis — only the transcript text.`;

export function getAnalysisPrompt(transcriptWordCount: number): string {
  const isLong = transcriptWordCount > 1500;
  const summaryLength = isLong
    ? "A detailed 5-8 sentence clinical summary covering key themes, patient affect, therapeutic alliance, and progress indicators"
    : "A 2-3 sentence clinical summary of the session";
  const entityCount = isLong ? "10-20" : "4-8";
  const storyFlowNote = isLong
    ? "Include multiple story arcs if present — longer sessions often cover several topics. Capture at least 3-5 story flow sequences."
    : "Capture the main narrative arc of the session.";
  const additionalFields = isLong
    ? `
  "therapeuticTechniques": ["Array of techniques observed (e.g., 'Cognitive Restructuring', 'Active Listening', 'Motivational Interviewing', 'Exposure Work')"],
  "riskFactors": ["Array of risk factors mentioned or observed (e.g., 'Social isolation', 'Substance use', 'Suicidal ideation') — empty array if none"],
  "protectiveFactors": ["Array of protective factors (e.g., 'Strong family support', 'Employment stability', 'Medication adherence') — empty array if none"],
  "sessionTopics": ["Array of distinct topics covered in the session (e.g., 'Work stress', 'Relationship conflict', 'Childhood trauma')"],
  "patientInsight": "Description of the patient's level of insight and self-awareness during the session",`
    : "";
  const additionalRules = isLong
    ? `
7. For longer sessions, extract MORE entities — aim for ${entityCount} to capture the full complexity.
8. Include therapeuticTechniques, riskFactors, protectiveFactors, sessionTopics, and patientInsight fields.
9. Identify distinct topic segments — a 40-min session typically covers 3-5 different topics.
10. The suggested follow-up should be specific and actionable, referencing specific issues from the session.`
    : "";

  return `You are an expert clinical psychology AI assistant analyzing a therapy session transcript.

This transcript is approximately ${transcriptWordCount} words (${Math.round(transcriptWordCount / 150)} minutes of speech).

Analyze the following transcript and return a JSON object with EXACTLY this structure (no markdown, no code fences, just raw JSON):

{
  "summary": "${summaryLength}",
  "status": "One of: 'Low concern', 'Moderate concern', 'High concern', 'Critical'",
  "wellnessScore": <number from 1 to 10, where 10 is excellent mental health and 1 is severe distress>,
  "primaryPattern": "The dominant psychological pattern observed (e.g., 'Episodic mood cycles', 'Trait-based / constant', 'Reactive to interpersonal triggers')",
  "suggestedFollowUp": "A specific clinical recommendation for the therapist",
  "entities": [
    {
      "id": "unique_id",
      "label": "Entity name (e.g., 'Sleep Loss', 'Grandiosity', 'Fear of Abandonment')",
      "type": "One of: 'symptom', 'behavior', 'emotion', 'event', 'trigger', 'outcome', 'patient'"
    }
  ],
  "edges": [
    {
      "source": "source_entity_id",
      "target": "target_entity_id",
      "label": "Relationship description (e.g., 'leads to', 'triggers', 'causes')"
    }
  ],
  "possibleConditionHints": ["Array of possible condition hints like 'ADHD', 'Bipolar', 'BPD', 'Depression', 'Anxiety'"],
  "temporalPattern": "Description of whether symptoms are episodic, constant, reactive, etc.",
  "storyFlow": [
    {
      "stage": "One of: 'Life Event', 'Trigger', 'Emotion', 'Behavior', 'Outcome'",
      "description": "What happened at this stage"
    }
  ]${additionalFields ? "," + additionalFields : ""}
}

IMPORTANT RULES:
1. Always include a "patient" entity as the central node with id "patient".
2. Connect all other entities to the patient or to each other where clinically relevant.
3. Extract at least ${entityCount} meaningful entities from the transcript.
4. The wellness score should reflect the overall mental health state described.
5. ${storyFlowNote}
6. Return ONLY valid JSON. No markdown formatting, no explanation text.${additionalRules}

Transcript:
`;
}
