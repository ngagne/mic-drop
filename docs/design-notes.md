Node.js API Test Platform Design Document

Overview

This document describes the architecture, design principles, project structure, CLI experience, execution model, reporting strategy, and configuration model for a modern Node.js-based API testing platform intended to replace large ReadyAPI test suites.

The platform is designed to:

* Execute API functional tests rapidly
* Support parallel test execution
* Organize tests around user journeys/business capabilities
* Support environment-specific configuration
* Support reusable authentication and request chaining
* Generate rich HTML reports
* Support optional performance/load testing
* Be fully version-controlled
* Integrate cleanly into CI/CD pipelines
* Provide a lightweight developer experience
* Scale to thousands of test cases

⸻

Goals

Primary Goals

* Replace ReadyAPI with a lightweight Node.js implementation
* Support large enterprise-scale API test suites
* Reduce execution time significantly through parallelism
* Standardize test organization and execution patterns
* Improve maintainability and reusability
* Support developer-friendly workflows
* Enable future extensibility for performance testing

Secondary Goals

* Provide rich HTML reporting
* Support local development workflows
* Support CI/CD execution
* Support tagging/filtering of tests
* Enable reusable helper libraries
* Support environment-specific behavior cleanly

⸻

Technology Stack

Concern	Technology
Runtime	Node.js
Language	TypeScript
Functional API Testing	PactumJS
Test Runner	Vitest
Performance Testing	k6
CLI Framework	Commander.js
HTML Reporting	Allure Report
Validation	Zod
Logging	Pino
Environment Config	YAML or JSON
Package Manager	pnpm
Linting	ESLint
Formatting	Prettier

⸻

High-Level Architecture

CLI
 ├── Functional Test Runner (Vitest + Pactum)
 ├── Performance Test Runner (k6)
 ├── Environment Loader
 ├── User Journey Discovery Engine
 ├── HTML Report Generator
 └── Browser Launcher
Test Suites
 ├── User Journeys
 ├── Shared Helpers
 ├── Authentication Flows
 ├── Schemas
 ├── Fixtures
 └── Environment Configurations

⸻

Core Design Principles

1. Tests Organized by User Journey

Tests should not be organized by endpoint.

Tests should be organized around:

* Business capabilities
* User workflows
* Consumer journeys
* Domain flows

This structure mirrors how systems are actually used.

Examples:

* customer-onboarding
* account-management
* payments
* claims-processing
* shopping-cart
* authentication

This approach improves:

* readability
* maintainability
* onboarding
* business alignment
* test discoverability

⸻

2. Shared Reusable Components

Common logic should never be duplicated.

Reusable components include:

* auth flows
* request builders
* schema validators
* environment utilities
* test data generators
* retry logic
* polling logic
* assertion helpers

⸻

3. Environment-Driven Configuration

All environment-specific values must be externalized.

Tests must never hardcode:

* domains
* credentials
* API keys
* tenant IDs
* test data identifiers
* environment-specific feature flags

The active environment is determined using:

ENVIRONMENT=qa

The platform automatically loads:

/config/environments/qa.yml

⸻

4. Fast Parallel Execution

The system is designed for:

* parallel suite execution
* isolated worker threads
* low startup overhead
* high scalability

The goal is to support thousands of tests efficiently.

⸻

5. Code-First Testing

Tests are implemented as TypeScript code.

Advantages over XML/UI-driven systems:

* reusable abstractions
* IDE refactoring
* type safety
* source control friendliness
* better debugging
* easier code review
* shared libraries

⸻

Opinionated Project Structure

/api-test-platform
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── .env
├── /bin
│   └── api-test
│
├── /config
│   ├── environments
│   │   ├── local.yml
│   │   ├── dev.yml
│   │   ├── qa.yml
│   │   ├── stage.yml
│   │   └── prod.yml
│   │
│   ├── config-loader.ts
│   └── schema.ts
│
├── /src
│   ├── /cli
│   │   ├── commands
│   │   │   ├── run.ts
│   │   │   ├── list.ts
│   │   │   └── perf.ts
│   │   │
│   │   ├── parser.ts
│   │   └── bootstrap.ts
│   │
│   ├── /core
│   │   ├── auth
│   │   ├── http
│   │   ├── reporting
│   │   ├── execution
│   │   ├── performance
│   │   └── discovery
│   │
│   ├── /shared
│   │   ├── fixtures
│   │   ├── schemas
│   │   ├── builders
│   │   ├── utils
│   │   ├── validators
│   │   └── constants
│   │
│   └── /journeys
│       ├── authentication
│       │   ├── functional
│       │   │   ├── login.test.ts
│       │   │   ├── logout.test.ts
│       │   │   └── refresh-token.test.ts
│       │   │
│       │   ├── performance
│       │   │   └── login-load.test.ts
│       │   │
│       │   ├── fixtures
│       │   └── helpers
│       │
│       ├── customer-onboarding
│       │   ├── functional
│       │   ├── performance
│       │   ├── fixtures
│       │   └── helpers
│       │
│       ├── payments
│       └── claims
│
├── /reports
│   ├── latest
│   └── history
│
├── /scripts
│   ├── generate-report.ts
│   └── open-report.ts
│
└── /docs
    ├── contributing.md
    ├── writing-tests.md
    └── migration-guide.md

⸻

User Journey Structure

Each user journey is self-contained.

Example:

/journeys/customer-onboarding

Contains:

Folder	Purpose
functional	Functional/API tests
performance	Load/performance tests
fixtures	Journey-specific test data
helpers	Journey-specific utilities

This creates:

* clear ownership
* domain separation
* easy discoverability
* independent scalability

⸻

Environment Configuration Model

Environment Selection

Environment selection is driven entirely by:

ENVIRONMENT=qa

The loader resolves:

/config/environments/qa.yml

⸻

Configuration File Example

qa.yml

name: qa
api:
  baseUrl: https://qa-api.company.com
  timeoutMs: 10000
credentials:
  standardUser:
    username: qa-user
    password: secret
  adminUser:
    username: qa-admin
    password: secret
headers:
  tenantId: qa-tenant
  clientId: qa-client
features:
  enableNewCheckout: true
testData:
  customerId: 10001
  productId: 5001

⸻

Configuration Loader

The configuration loader:

* validates configuration schema
* loads environment-specific files
* exposes typed configuration globally
* caches configuration
* supports overrides

Example:

import { config } from '@/config/config-loader';
const baseUrl = config.api.baseUrl;

⸻

Secrets Handling

Secrets should not be committed.

Recommended strategy:

* non-sensitive config in version control
* secrets loaded from:
    * environment variables
    * vault systems
    * CI secret stores

Example:

credentials:
  standardUser:
    username: qa-user
    password: ${QA_STANDARD_PASSWORD}

⸻

Functional Testing Model

Framework

* PactumJS
* Vitest

⸻

Request Chaining Example

import { spec } from 'pactum';
let authToken: string;
beforeAll(async () => {
  const response = await spec()
    .post('/auth/login')
    .withJson({
      username: config.credentials.standardUser.username,
      password: config.credentials.standardUser.password
    })
    .expectStatus(200);
  authToken = response.body.token;
});
it('should retrieve customer profile', async () => {
  await spec()
    .get('/customers/me')
    .withHeaders('Authorization', `Bearer ${authToken}`)
    .expectStatus(200);
});

⸻

Authentication Strategy

Authentication should be centralized.

Recommended:

/core/auth

Authentication helpers should:

* cache tokens where appropriate
* refresh tokens automatically
* abstract authentication complexity
* support multiple auth schemes

Supported auth patterns:

* OAuth2
* JWT
* API keys
* mTLS
* Basic auth
* Session cookies

⸻

Test Discovery

The platform automatically discovers:

* journeys
* functional tests
* performance tests

Discovery is filesystem-driven.

This eliminates:

* central registration files
* manual suite declarations
* duplicated metadata

⸻

CLI Design

Primary Command

api-test run

Runs:

* all functional tests
* parallel execution enabled
* HTML report generation
* browser auto-open

⸻

Run Specific Journey

api-test run customer-onboarding

Runs only:

/journeys/customer-onboarding

⸻

Run Performance Tests

api-test run --performance

Runs:

* functional tests
* performance tests

⸻

Run Journey Performance Tests

api-test run payments --performance

Runs:

* payments functional tests
* payments performance tests

⸻

List Available Journeys

api-test list

Example output:

Available User Journeys
authentication
  - login
  - logout
  - refresh-token
customer-onboarding
  - create-customer
  - verify-email
  - activate-account
payments
  - create-payment
  - refund-payment

⸻

CLI Help

api-test --help

Displays:

* commands
* flags
* examples
* environment usage

⸻

CLI Flags

Flag	Purpose
–performance	Include performance tests
–environment	Override ENVIRONMENT
–report-only	Generate report only
–parallel	Override parallel worker count
–verbose	Enable detailed logging
–tags	Run tagged tests only
–ci	CI-friendly output

⸻

Parallel Execution Strategy

Vitest worker threads are used for:

* journey-level parallelism
* file-level parallelism

Goals:

* maximize CPU usage
* minimize runtime
* isolate failures

Default:

1 worker per CPU core

Configurable via:

--parallel=8

⸻

Reporting Architecture

Reporting Technology

Allure Report is recommended.

Advantages:

* rich HTML reports
* historical trends
* screenshots/log attachments
* environment metadata
* performance metric support
* CI integrations

⸻

Report Generation Flow

Tests Execute
   ↓
Raw Results Generated
   ↓
Allure Results Aggregated
   ↓
HTML Report Generated
   ↓
Browser Opens Automatically

⸻

Report Features

Functional Reports

Include:

* pass/fail summary
* execution duration
* request/response payloads
* headers
* assertion failures
* stack traces
* environment metadata
* execution timeline

⸻

Performance Reports

Include:

* response time percentiles
* average latency
* throughput
* error rate
* request rate
* concurrent users
* threshold validation
* performance graphs

⸻

Browser Auto-Open

After report generation:

/reports/latest/index.html

Automatically opens in the system browser.

This behavior can be disabled:

--ci

⸻

Performance Testing Architecture

Framework

k6 is recommended.

Reasons:

* lightweight
* JavaScript-based
* scalable
* cloud-capable
* modern reporting
* CI-friendly

⸻

Performance Test Organization

/journeys/payments/performance

Example:

create-payment-load.test.ts

⸻

Performance Test Example

import http from 'k6/http';
export const options = {
  vus: 50,
  duration: '1m'
};
export default function () {
  const loginResponse = http.post('https://api.example.com/login', {
    username: 'test',
    password: 'test'
  });
  const token = loginResponse.json('token');
  http.get('https://api.example.com/customers', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

⸻

Tagging Strategy

Tests should support tags.

Examples:

* smoke
* regression
* integration
* performance
* critical
* payments
* auth

Example:

it('should create payment', {
  tags: ['smoke', 'payments']
}, async () => {
});

⸻

Logging Strategy

Logging Framework

Pino

Advantages:

* extremely fast
* structured logging
* JSON output
* CI-friendly

⸻

Log Levels

Level	Purpose
info	Standard execution events
warn	Recoverable issues
error	Failures
debug	Detailed troubleshooting

⸻

CI/CD Integration

Supported Platforms

* GitHub Actions
* Jenkins
* GitLab CI
* Azure DevOps

⸻

CI Execution Example

ENVIRONMENT=qa api-test run --ci

⸻

CI Artifacts

Generated artifacts:

* HTML reports
* raw test results
* logs
* performance metrics

⸻

Failure Handling

The platform should support:

* retry policies
* polling utilities
* eventual consistency handling
* soft assertions
* failure categorization

⸻

Migration Strategy from ReadyAPI

Phase 1

Build foundational platform:

* CLI
* config loader
* auth framework
* reporting
* execution model

⸻

Phase 2

Migrate common flows:

* authentication
* shared setup
* reusable utilities

⸻

Phase 3

Migrate user journeys incrementally.

Recommended mapping:

ReadyAPI Concept	New Platform
Test Suite	User Journey
Test Case	Test File
Test Step	Pactum Request
Properties	Environment Config
Groovy Script	TypeScript Helper

⸻

Phase 4

Introduce performance testing.

⸻

Scalability Considerations

The platform should support:

* thousands of tests
* distributed CI execution
* selective execution
* report history retention
* parallel workers
* test sharding

⸻

Future Enhancements

Potential future capabilities:

* OpenAPI contract validation
* GraphQL support
* visual dashboards
* flaky test detection
* distributed execution
* cloud report hosting
* Slack notifications
* Teams notifications
* synthetic monitoring reuse
* Kubernetes-native execution

⸻

Recommended NPM Scripts

{
  "scripts": {
    "test": "api-test run",
    "test:perf": "api-test run --performance",
    "test:list": "api-test list",
    "report": "node scripts/generate-report.ts"
  }
}

⸻

Example Developer Workflow

Run all QA tests

ENVIRONMENT=qa api-test run

⸻

Run only payment journey

ENVIRONMENT=qa api-test run payments

⸻

Run payment journey with performance tests

ENVIRONMENT=qa api-test run payments --performance

⸻

List all journeys

api-test list

⸻

Recommended Conventions

Naming

Artifact	Convention
Journey Folder	kebab-case
Test File	*.test.ts
Helper File	*.helper.ts
Fixture File	*.fixture.ts
Schema File	*.schema.ts

⸻

Testing Standards

All tests should:

* be deterministic
* avoid shared mutable state
* avoid execution ordering dependencies
* support parallel execution
* use centralized auth helpers
* use centralized config access
* include meaningful assertions
* avoid hardcoded environment values

⸻

Summary

This architecture provides:

* fast parallel execution
* modern developer experience
* environment-driven configuration
* scalable test organization
* reusable abstractions
* enterprise maintainability
* rich HTML reporting
* optional performance testing
* CI/CD friendliness
* future extensibility

The proposed design modernizes legacy ReadyAPI workflows into a scalable, maintainable, code-first Node.js testing platform optimized for enterprise API testing.