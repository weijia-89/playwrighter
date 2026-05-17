# Component Testing

**Source**: [Playwright Components Docs](https://playwright.dev/docs/test-components)

**Status:** Experimental but widely used in production.

---

## When Component Testing > E2E

| Scenario | Test type |
|----------|-----------|
| Single component behavior (Button, Modal, Form) | **Component** |
| Component combinations on a page | **Component** |
| Full user flow (login → checkout) | **E2E** |
| Backend integration | **API + E2E** |
| Visual regression on a card | **Component** + visual |

Component tests:
- Mount in a real browser (Chromium/Firefox/WebKit)
- Run faster than E2E (no full page load)
- Test props, events, slots, render output
- Use the same assertions/locators as E2E tests

---

## Setup

```bash
# React
npm init playwright@latest -- --ct
# Or manually:
npm i -D @playwright/experimental-ct-react

# Vue / Svelte
npm i -D @playwright/experimental-ct-vue
npm i -D @playwright/experimental-ct-svelte
```

`playwright-ct.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

---

## Basic Pattern

> **File extension matters:** use `.spec.tsx` (not `.spec.ts`) for React component tests so JSX compiles. Same for `.spec.vue` for Vue.

```tsx
// src/components/Button.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from './Button';

test('renders label', async ({ mount }) => {
  const component = await mount(<Button label="Submit" />);
  await expect(component).toContainText('Submit');
});

test('fires onClick', async ({ mount }) => {
  let clicked = false;
  const component = await mount(
    <Button label="Submit" onClick={() => { clicked = true; }} />
  );
  await component.click();
  expect(clicked).toBe(true);
});

test('disabled state prevents click', async ({ mount }) => {
  let clicked = false;
  const component = await mount(
    <Button label="Submit" disabled onClick={() => { clicked = true; }} />
  );
  await component.click({ force: true });  // bypass disabled check
  expect(clicked).toBe(false);
});
```

---

## Props, Slots, Children

```typescript
// Props
await mount(<Modal isOpen={true} title="Confirm" />);

// Slots / children (React)
await mount(
  <Card>
    <h1>Title</h1>
    <p>Body</p>
  </Card>
);

// Vue slots
await mount(<Card>{ default: () => 'Slot content' }</Card>);
```

---

## Hooks (Theming, Routing, Stores)

For components that depend on global context (theme provider, router, Redux), use hooks:

```typescript
// playwright/index.tsx
import { beforeMount, afterMount } from '@playwright/experimental-ct-react/hooks';
import { ThemeProvider } from '../src/theme';

beforeMount(async ({ App }) => {
  return (
    <ThemeProvider theme="dark">
      <App />
    </ThemeProvider>
  );
});
```

Now ALL component tests render inside the ThemeProvider.

---

## Update Component Mid-Test

```typescript
const component = await mount(<Counter initial={0} />);
await expect(component).toContainText('Count: 0');

await component.update(<Counter initial={5} />);
await expect(component).toContainText('Count: 5');
```

---

## Network Mocking in Component Tests

Same `page.route()` API works:

```typescript
test('loads users from API', async ({ mount, page }) => {
  await page.route('**/api/users', route =>
    route.fulfill({ json: [{ id: 1, name: 'Alice' }] })
  );

  const component = await mount(<UserList />);
  await expect(component.getByText('Alice')).toBeVisible();
});
```

---

## Visual Regression on Components

```typescript
test('Button visual', async ({ mount }) => {
  const component = await mount(<Button label="Submit" variant="primary" />);
  await expect(component).toHaveScreenshot('button-primary.png');
});
```

Tighter scope = more stable than full-page screenshots.

---

## Best Practices

### DO
- **Mount inside each test**, don't share component instances across tests
- **Test props + events + slots**, that's the component contract
- **Use accessible locators**, `getByRole`, `getByLabel` (same as E2E)
- **Mock network at boundary**, `page.route()` works
- **Visual regression for UI library**, component-level snapshots are stable

### DON'T
- **Import server-only modules**, Node-side mocks don't cross to browser
- **Test deep prop drilling**, that's an E2E concern
- **Replace E2E with component tests**, different layers, both needed
- **Mutate global state**, use `beforeMount` hooks for setup

---

## Pitfalls

### 1. Module mocks don't cross Node/browser boundary
```typescript
// ❌ Won't work: jest.mock-style
jest.mock('../api', () => ({ fetchUsers: () => [] }));

// ✅ Use page.route() to mock at network layer
await page.route('**/api/users', route => route.fulfill({ json: [] }));
```

### 2. CSS imports
Component tests import CSS via Vite. If your build uses webpack/CSS-in-JS, configuration may need adjustment.

### 3. State leakage between tests
If a component writes to `localStorage` or a global store, reset between tests:
```typescript
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
});
```

---

## Anti-Patterns

```typescript
// ❌ Sharing mounted component across tests
let component;
test.beforeAll(async ({ mount }) => {
  component = await mount(<Counter />);  // Won't work; mount is per-test
});

// ✅ Mount inside each test
test('test 1', async ({ mount }) => {
  const component = await mount(<Counter />);
});
```

```typescript
// ❌ Testing implementation details
const component = await mount(<Button />);
expect(component.locator('.button-internal-class')).toBeVisible();

// ✅ Test what users see
expect(component.getByRole('button', { name: 'Submit' })).toBeVisible();
```
