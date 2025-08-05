import type { Agent } from '../types/Agent';

export const agents: Agent[] = [
  {
    id: 'optimize',
    name: 'conversion-optimizer',
    description: "AI-powered conversion rate optimization. Analyzes your site's UX patterns, suggests A/B tests, and provides industry-specific optimization strategies based on your ICP.",
    icon: '📈',
    stats: {
      downloads: 12400,
      upvotes: 92,
      votes: 234,
    },
    content: '',
    last_updated: '2d ago',
    isPopular: true,
  },
  {
    id: 'security',
    name: 'security-auditor',
    description: 'Continuous security scanning and vulnerability detection. Checks for OWASP Top 10, reviews dependencies, and suggests security hardening measures.',
    icon: '🔒',
    stats: {
      downloads: 8700,
      upvotes: 95,
      votes: 189,
    },
    content: '',
    last_updated: '5d ago',
    isPopular: false,
  },
  {
    id: 'performance',
    name: 'performance-optimizer',
    description: 'Identifies performance bottlenecks, suggests optimizations for Core Web Vitals, and provides code splitting strategies tailored to your stack.',
    icon: '⚡',
    stats: {
      downloads: 15200,
      upvotes: 88,
      votes: 412,
    },
    content: '',
    last_updated: '1w ago',
    isPopular: true,
  },
  {
    id: 'accessibility',
    name: 'accessibility-guardian',
    description: 'Ensures WCAG 2.1 AA/AAA compliance. Provides detailed accessibility reports, suggests ARIA improvements, and helps maintain inclusive design standards.',
    icon: '♿',
    stats: {
      downloads: 6300,
      upvotes: 96,
      votes: 87, // Less than 100, won't show percentage
    },
    content: '',
    last_updated: '3d ago',
    isPopular: false,
  },
  {
    id: 'database',
    name: 'database-architect',
    description: 'Optimizes database queries, suggests indexing strategies, and helps design efficient schemas. Supports PostgreSQL, MySQL, MongoDB, and more.',
    icon: '🗄️',
    stats: {
      downloads: 9800,
      upvotes: 84,
      votes: 201,
    },
    content: '',
    last_updated: '1w ago',
    isPopular: false,
  },
  {
    id: 'api',
    name: 'api-designer',
    description: 'Designs RESTful and GraphQL APIs following best practices. Generates OpenAPI specs, suggests versioning strategies, and ensures consistency.',
    icon: '🔌',
    stats: {
      downloads: 11200,
      upvotes: 91,
      votes: 287,
    },
    content: '',
    last_updated: '4d ago',
    isPopular: true,
  },
  {
    id: 'testing',
    name: 'test-writer',
    description: 'Generates comprehensive test suites. Creates unit tests, integration tests, and E2E scenarios based on your code structure.',
    icon: '🧪',
    stats: {
      downloads: 85, // Less than 100, won't show
      upvotes: 78,
      votes: 23, // Less than 100, won't show percentage
    },
    content: '',
    last_updated: '2w ago',
    isPopular: false,
  },
  {
    id: 'docs',
    name: 'documentation-generator',
    description: 'Auto-generates comprehensive documentation from code. Creates API docs, README files, and inline documentation.',
    icon: '📚',
    stats: {
      downloads: 92, // Less than 100, won't show
      upvotes: 100,
      votes: 8, // Less than 100, won't show percentage
    },
    content: '',
    last_updated: '6d ago',
    isPopular: false,
  },
];