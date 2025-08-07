import type { Agent } from '../types/Agent';

export function createMockAgent(overrides?: Partial<Agent>): Agent {
  return {
    id: 'test-agent',
    name: 'test-agent',
    display_name: 'Test Agent',
    description: 'Test agent description',
    metadata: {
      category: 'Testing',
      tags: ['test', 'mock'],
    },
    stats: {
      downloads: 1000,
      upvotes: 90,
      downvotes: 10,
    },
    content: '---\nname: test-agent\n---\nAgent content here',
    last_updated: '1d ago',
    ...overrides,
  };
}

export const mockAgents: Agent[] = [
  {
    id: 'optimize',
    name: 'conversion-optimizer',
    display_name: 'Conversion Optimizer',
    description: 'AI-powered conversion rate optimization. Analyzes your site\'s UX patterns, suggests A/B tests, and provides industry-specific optimization strategies based on your ICP.',
    metadata: {
      category: 'Marketing',
      tags: ['optimization', 'conversion', 'analytics'],
    },
    stats: {
      downloads: 12400,
      upvotes: 92,
      downvotes: 142,  // Total was 234, so 234 - 92 = 142
    },
    content: '',
    last_updated: '2d ago',
    isPopular: true,
  },
  {
    id: 'security',
    name: 'security-auditor',
    display_name: 'Security Auditor',
    description: 'Continuous security scanning and vulnerability detection. Checks for OWASP Top 10, reviews dependencies, and suggests security hardening measures.',
    metadata: {
      category: 'Security',
      tags: ['security', 'vulnerability', 'audit'],
    },
    stats: {
      downloads: 8700,
      upvotes: 95,
      downvotes: 94,  // Total was 189, so 189 - 95 = 94
    },
    content: '',
    last_updated: '5d ago',
    isPopular: false,
  },
  {
    id: 'performance',
    name: 'performance-optimizer',
    display_name: 'Performance Optimizer',
    description: 'Identifies performance bottlenecks, suggests optimizations for Core Web Vitals, and provides code splitting strategies tailored to your stack.',
    metadata: {
      category: 'Performance',
      tags: ['performance', 'optimization', 'web-vitals'],
    },
    stats: {
      downloads: 15200,
      upvotes: 88,
      downvotes: 324,  // Total was 412, so 412 - 88 = 324
    },
    content: '',
    last_updated: '1w ago',
    isPopular: true,
  },
  {
    id: 'testing',
    name: 'test-writer',
    display_name: 'Test Writer',
    description: 'Generates comprehensive test suites. Creates unit tests, integration tests, and E2E scenarios based on your code structure.',
    metadata: {
      category: 'Testing',
      tags: ['testing', 'unit-tests', 'e2e'],
    },
    stats: {
      downloads: 85,
      upvotes: 15,
      downvotes: 8,  // Total was 23, so using smaller values for test
    },
    content: '',
    last_updated: '2w ago',
    isPopular: false,
  },
];

export const mockAgentSource = {
  yaml: `name: conversion-optimizer
package: "@agenthub/optimize"
version: 2.4.0
description: "AI-powered conversion rate optimization"
tools:
  - Read
  - Write
  - WebFetch
category: Marketing`,
  prompt: `You are a conversion rate optimization expert specialized in improving website and application conversion rates.

Your role is to:
1. Analyze user interface elements
2. Suggest A/B testing strategies
3. Provide industry-specific optimization strategies
4. Identify friction points in user flows`,
};