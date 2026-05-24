# playwrighter architecture

playwrighter is a **documentation + scaffolding + lint/score harness** for Playwright E2E suites. It does not run application tests inside this repo; it teaches patterns, ships copy-paste templates, and enforces a syntactic quality bar on `.spec.ts` trees in consumer projects (and on the external [northwind-qa](https://github.com/weijia-89/northwind-qa) dogfood suite in CI).

---

## System context

```mermaid
flowchart TB
  subgraph actors [Actors]
    Human[Human engineer]
    Agent[AI agent Cursor / CLI / other]
  end

  subgraph playwrighter [playwrighter repo]
    Rule[".cursor/rules/playwrighter.mdc"]
    Skill["skill/SKILL.md"]
    Patterns["patterns/ 23 topic files"]
    Templates["templates/ bootstrap kit"]
    Tools["tools/ validate + score"]
    Index["INDEX.md / README.md"]
  end

  subgraph consumer [Consumer test project]
    Specs["*.spec.ts suite"]
    Config["playwright.config.ts"]
    Fix["fixtures.ts + POMs"]
    CopiedTools["tools/ copied from playwrighter"]
  end

  subgraph external [External validation]
    SUT[Application under test]
    NW["northwind-qa dogfood suite"]
    GHA["GitHub Actions dogfood workflow"]
  end

  Human --> Index
  Human --> Templates
  Agent --> Rule
  Rule --> Skill
  Skill --> Patterns
  Skill --> Templates
  Agent --> Patterns
  Templates --> consumer
  Tools --> CopiedTools
  CopiedTools --> Specs
  Specs --> SUT
  GHA --> Tools
  GHA --> NW
  NW --> SUT
```

---

## In-repo layers

| Layer | Path | Role |
|-------|------|------|
| **Agent entry** | `.cursor/rules/playwrighter.mdc` | Cursor rule: globs, invariants, points at canonical skill |
| **Canonical skill** | `skill/SKILL.md` | Single source of truth for agents; workflow, pattern index, output contract |
| **Patterns** | `patterns/*.md` | Deep guidance (23 files); not all rules are machine-enforced |
| **Templates** | `templates/` | Starter config, fixtures, POMs, `package.json`, `scripts/check-tools.js` |
| **Tools** | `tools/validate-suite.sh`, `tools/score-tests.js` | Grep-based linter + 100-point scorecard (inline rubric in JS) |
| **Human entry** | `README.md`, `INDEX.md`, `GETTING_STARTED.md` | Onboarding and topic map |
| **CI contract** | `.github/workflows/dogfood-northwind-qa.yml` | Lint + score external northwind-qa on every main PR |
| **SDK automation** | `scripts/cursor-sdk/` | Optional `Agent.prompt` runners (harness fixes, arch regen) |

```mermaid
flowchart LR
  subgraph docs [Knowledge]
    SKILL[skill/SKILL.md]
    PAT[patterns/]
    AP[anti-patterns.md]
  end

  subgraph agent [Agent surface]
    MDC[playwrighter.mdc]
  end

  subgraph enforce [Enforcement]
    VAL[validate-suite.sh]
    SCR[score-tests.js]
  end

  subgraph ship [Scaffolding]
    TPL[templates/]
  end

  MDC --> SKILL
  SKILL --> PAT
  PAT --> AP
  SKILL --> TPL
  TPL --> VAL
  TPL --> SCR
  PAT -.->|guides| VAL
  PAT -.->|rubric alignment| SCR
```

---

## Agent workflow (write tests)

```mermaid
sequenceDiagram
  participant U as User / IDE
  participant R as playwrighter.mdc
  participant S as skill/SKILL.md
  participant P as patterns/
  participant C as codegen / templates
  participant T as tools/

  U->>R: Edit *.spec.ts or ask for tests
  R->>S: Load canonical skill
  S->>P: Read baseline 4 + task patterns
  S->>C: Scaffold from templates
  C->>U: Specs with fixtures POM tags
  U->>T: validate-suite.sh
  T-->>U: errors / warnings
  U->>T: score-tests.js
  T-->>U: score ≥ 80 or fail
```

**Mandatory pattern reads** (any task): `locator-strategy`, `waiting-timing`, `assertions`, `anti-patterns`, plus task-specific files listed in `skill/SKILL.md`.

**Output contract** (spec files): `./fixtures` imports, `[TC-XXX]`, `@P0`/`@smoke` tags, web-first `expect`, accessible locators.

---

## Pattern taxonomy (23 files)

```mermaid
mindmap
  root((patterns/))
    Core
      locator-strategy
      waiting-timing
      assertions
      anti-patterns
    Architecture
      fixtures
      page-object-model
      test-structure
      test-data
    Auth
      authentication
      oauth-mfa-sso
    Specialized
      network-mocking
      iframes-and-frames
      mobile-responsive
      visual-regression
      accessibility
      performance
      api-testing
    Modern
      test-agents
      component-testing
      eslint-and-linting
    Operations
      debugging-traces
      ci-cd
      reporters
```

---

## Consumer bootstrap

```mermaid
flowchart TD
  A[Clone / vendor playwrighter] --> B[Copy templates/ into test project]
  B --> C[Copy tools/ into test project]
  C --> D[npm install + playwright install]
  D --> E[Configure .env BASE_URL creds]
  E --> F[auth.setup.ts writes storageState]
  F --> G[Write specs from test-template.ts]
  G --> H{Quality gates}
  H -->|validate-suite.sh exit 0| I{score ≥ 80?}
  I -->|yes| J[CI / merge]
  I -->|no| G
  H -->|errors| G
```

`templates/scripts/check-tools.js` fails fast if `tools/` was not copied before `npm run validate` / `score`.

---

## Enforcement pipeline

Not every row in `anti-patterns.md` is automated. Two tools split responsibility:

```mermaid
flowchart TB
  subgraph input [Input]
    Files[".spec.ts / .test.ts tree"]
  end

  subgraph validate [validate-suite.sh]
    E1[waitForTimeout / networkidle]
    E2[manual isVisible / textContent]
    E3[toBeTruthy / test.only / page.pause]
    W1[CSS class locators warnings]
    W2[if-await / force:true warnings]
  end

  subgraph score [score-tests.js]
    R1[Reliability penalties]
    R2[Locator CSS in .locator]
    R3[TC-ID tags expect density]
    R4[fixture import in specs]
  end

  subgraph outcome [Outcome]
    Pass[Ship if both pass threshold]
    Review[Human review for semantic gaps]
  end

  Files --> validate
  Files --> score
  validate -->|exit 1 on errors| Review
  score -->|exit 1 if below 80| Review
  validate --> Pass
  score --> Pass
```

| Check | validate-suite | score-tests |
|-------|----------------|-------------|
| `waitForTimeout` | Error | −10 |
| `networkidle` | Error | −10 |
| `expect(await …isVisible())` | Error | −5 |
| `test.only` / `page.pause` | Error | −3 / −5 |
| `if (await …)` | Warning | −3 |
| `{ force: true }` | Warning | −2 |
| Missing `[TC-XXX]` | — | up to −10 |
| `@playwright/test` in spec | — | −5 |
| CSS in `.locator('.#…')` | Warning | −2 each cap 10 |

---

## CI dogfood (this repo)

```mermaid
flowchart LR
  Push[push / PR to main] --> CheckoutPW[checkout playwrighter]
  CheckoutPW --> CheckoutNW[checkout northwind-qa]
  CheckoutNW --> Val[validate-suite.sh on northwind-qa/tests]
  Val --> Scr[score-tests.js threshold 80]
  Scr --> Summary[GitHub step summary]
```

playwrighter has **no in-repo `.spec.ts` dogfood**; the contract suite lives in `weijia-89/northwind-qa`.

---

## Integration modes

```mermaid
flowchart TB
  subgraph modes [How teams adopt playwrighter]
    Vendored["Vendored subfolder playwrighter/"]
    Root["Repo root is playwrighter"]
    SymlinkSkill["Symlink skill/SKILL.md only"]
    SymlinkRule["Symlink .cursor/rules/playwrighter.mdc"]
  end

  Vendored --> Prefix["Paths prefixed playwrighter/"]
  Root --> NoPrefix["Paths skill/ patterns/ tools/"]
  SymlinkSkill --> AgentOnly[Agent reads patterns from checkout]
  SymlinkRule --> CursorLoads[Cursor loads rule on spec globs]
```

---

## Regenerating this document

```bash
cd scripts/cursor-sdk
export CURSOR_API_KEY=...
npm run generate-arch
```

Or edit `ARCH.MD` by hand; keep diagrams aligned with `skill/SKILL.md` and `tools/score-tests.js` rubric comments.
