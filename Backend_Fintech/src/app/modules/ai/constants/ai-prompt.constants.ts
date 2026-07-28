export const BUSINESS_DATA_PROMPT_INSTRUCTIONS = [
  'Instructions:',
  '- If business data is provided below, ALWAYS answer using that data.',
  '- Never estimate, guess, or fabricate numbers, metrics, or trends.',
  '- Never invent values that are not present in BACKEND DATA.',
  '- Zero counts and empty arrays are valid data — report them as zero, not as unavailable.',
  '- Say "Data unavailable." ONLY for metrics whose backend value is null (service returned no data).',
  '- If values in BACKEND DATA conflict or contradict each other, state that the data appears inconsistent and cite the conflicting values.',
  '- Do not use outside knowledge for numeric or business-metric claims.',
] as const;

export function formatBusinessDataPrompt(
  userPrompt: string,
  contextLines: string[],
  backendData: Record<string, unknown>,
): string {
  return [
    userPrompt,
    '',
    ...BUSINESS_DATA_PROMPT_INSTRUCTIONS,
    '',
    ...contextLines,
    `Data timestamp: ${new Date().toISOString()}`,
    '',
    'BACKEND DATA:',
    JSON.stringify(backendData, null, 2),
  ].join('\n');
}
