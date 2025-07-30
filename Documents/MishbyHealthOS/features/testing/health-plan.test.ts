// features/testing/health-plan.test.ts

import { describe, it, expect } from 'vitest';
import { generatePlan } from '../../health-plan/planGenerator';
import { vataUser, pittaUser, kaphaUser } from './mocks/mockData';

describe('Health Plan Generator', () => {
  it('should return correct plan for Vata', () => {
    const plan = generatePlan(vataUser);
    expect(plan.title).toContain('Vata Test');
    expect(plan.recommendations.length).toBeGreaterThan(0);
    expect(plan.tips.length).toBeGreaterThan(0);
  });

  it('should return correct plan for Pitta', () => {
    const plan = generatePlan(pittaUser);
    expect(plan.title).toContain('Pitta Test');
    expect(plan.recommendations.length).toBeGreaterThan(0);
    expect(plan.tips.length).toBeGreaterThan(0);
  });

  it('should return correct plan for Kapha', () => {
    const plan = generatePlan(kaphaUser);
    expect(plan.title).toContain('Kapha Test');
    expect(plan.recommendations.length).toBeGreaterThan(0);
    expect(plan.tips.length).toBeGreaterThan(0);
  });
});
