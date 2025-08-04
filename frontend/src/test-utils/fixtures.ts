import type { Agent } from '../types/Agent';

export const mockAgents: Agent[] = [
  {
    id: 'optimize',
    name: 'Conversion Optimizer',
    package: '@agenthub/optimize',
    category: 'Marketing',
    description: 'AI-powered conversion rate optimization. Analyzes your site\'s UX patterns, suggests A/B tests, and provides industry-specific optimization strategies based on your ICP.',
    icon: '📈',
    downloads: 12400,
    upvotes: 92,
    votes: 234,
    lastUpdated: '2d ago',
    isPopular: true,
  },
  {
    id: 'security',
    name: 'Security Auditor',
    package: '@agenthub/security-audit',
    category: 'Security',
    description: 'Continuous security scanning and vulnerability detection. Checks for OWASP Top 10, reviews dependencies, and suggests security hardening measures.',
    icon: '🔒',
    downloads: 8700,
    upvotes: 95,
    votes: 189,
    lastUpdated: '5d ago',
    isPopular: false,
  },
  {
    id: 'performance',
    name: 'Performance Optimizer',
    package: '@agenthub/perf-optimizer',
    category: 'Infrastructure',
    description: 'Identifies performance bottlenecks, suggests optimizations for Core Web Vitals, and provides code splitting strategies tailored to your stack.',
    icon: '⚡',
    downloads: 15200,
    upvotes: 88,
    votes: 412,
    lastUpdated: '1w ago',
    isPopular: true,
  },
  {
    id: 'testing',
    name: 'Test Writer',
    package: '@agenthub/test-writer',
    category: 'Quality',
    description: 'Generates comprehensive test suites. Creates unit tests, integration tests, and E2E scenarios based on your code structure.',
    icon: '🧪',
    downloads: 85,
    upvotes: 78,
    votes: 23,
    lastUpdated: '2w ago',
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