import { baselineDistribution, questions, stages, type ReadinessAnswers, type ReadinessDimension } from "@/data/aiReadiness";

export type ReadinessResult = {
  total: number;
  score: number;
  average: number;
  scores: Record<ReadinessDimension, number>;
  stageIndex: number;
  stage: (typeof stages)[number];
  percentile: number;
  strongest: ReadinessDimension;
  weakest: ReadinessDimension;
};

export const dimensionOrder: ReadinessDimension[] = questions.map((question) => question.dimension);

export function getStageIndex(average: number): number {
  if (average <= 1.8) return 0;
  if (average <= 2.6) return 1;
  if (average <= 3.4) return 2;
  if (average <= 4.2) return 3;
  return 4;
}

export function scoreReadiness(answers: ReadinessAnswers): ReadinessResult {
  const values = dimensionOrder.map((dimension) => answers[dimension] ?? 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = total / dimensionOrder.length;
  const stageIndex = getStageIndex(average);
  const strongestIndex = values.reduce((best, value, index) => value > values[best] ? index : best, 0);
  const weakestIndex = values.reduce((weakest, value, index) => value < values[weakest] ? index : weakest, 0);
  const below = baselineDistribution.slice(0, stageIndex).reduce((sum, value) => sum + value, 0);
  const percentile = Math.round(below + baselineDistribution[stageIndex] / 2);

  return {
    total,
    score: Math.round((total / 25) * 100),
    average,
    scores: Object.fromEntries(dimensionOrder.map((dimension, index) => [dimension, values[index]])) as Record<ReadinessDimension, number>,
    stageIndex,
    stage: stages[stageIndex],
    percentile,
    strongest: dimensionOrder[strongestIndex],
    weakest: dimensionOrder[weakestIndex],
  };
}
