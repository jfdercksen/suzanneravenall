// Shared 5-point Likert scale used by every quiz's questions.
// Answer scale: Never=0, Rarely=1, Sometimes=2, Often=3, Almost Always=4
export const SCALE: { label: string; value: number }[] = [
  { label: 'Never', value: 0 },
  { label: 'Rarely', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Often', value: 3 },
  { label: 'Almost Always', value: 4 },
]

export function labelForValue(value: number): string {
  return SCALE.find((option) => option.value === value)?.label ?? 'Unknown'
}
