# iframes & Shadow DOM

**Source**: [Playwright FrameLocator Docs](https://playwright.dev/docs/api/class-framelocator), [Locators - Shadow DOM](https://playwright.dev/docs/locators)

---

## When You'll Need This

- **Stripe checkout**, payment form is in an iframe
- **YouTube/Vimeo embeds**, videos in iframes
- **OAuth provider redirects**, sometimes iframed
- **Third-party widgets**, chat, ads, surveys
- **Web Components**, Shadow DOM for encapsulation

---

## iframes (FrameLocator)

### Basic pattern
```typescript
// Get the iframe by attribute, then find elements within
const stripe = page.frameLocator('iframe[name="stripe"]');
await stripe.getByLabel('Card number').fill('4242 4242 4242 4242');
await stripe.getByLabel('Expiration').fill('12/34');
await stripe.getByLabel('CVC').fill('123');

// Click is on the parent page, not the frame
await page.getByRole('button', { name: 'Pay $99' }).click();
```

### Find iframe by various locators
```typescript
// By name attribute
page.frameLocator('iframe[name="payment"]')

// By title (most accessible)
page.frameLocator('iframe[title="Payment form"]')

// By URL
page.frameLocator('iframe[src*="stripe.com"]')

// First/nth iframe
page.frameLocator('iframe').first()
page.frameLocator('iframe').nth(2)
```

### Nested iframes
```typescript
const outer = page.frameLocator('iframe#outer');
const inner = outer.frameLocator('iframe#inner');
await inner.getByRole('button', { name: 'Click me' }).click();
```

### Reusable frame reference
```typescript
const checkout = page.frameLocator('iframe[name="checkout"]');
// Use multiple times, locators are lazy
await checkout.getByLabel('Email').fill(email);
await checkout.getByLabel('Card').fill(card);
await checkout.getByRole('button', { name: 'Pay' }).click();
```

---

## When iframe Hasn't Loaded Yet

FrameLocator auto-waits for the iframe to attach + load:

```typescript
// ✅ Auto-waits
await page.frameLocator('iframe[name="payment"]')
  .getByLabel('Card')
  .fill('4242...');

// If you need to wait explicitly:
await expect(page.locator('iframe[name="payment"]')).toBeVisible();
```

---

## Frame.contentFrame() Pattern (Locator-First)

If you have a regular `Locator` that points to an iframe element:

```typescript
const iframeLocator = page.locator('iframe[name="payment"]');
const frame = iframeLocator.contentFrame();
await frame.getByLabel('Card').fill('...');
```

Useful when you want a single Locator that conditionally points to an iframe.

---

## Cross-Origin iframes

Playwright handles cross-origin iframes natively. No extra config needed.

---

## Shadow DOM

Playwright **pierces shadow DOM automatically**. You usually don't need anything special.

```typescript
// Web component <my-button> with shadow root containing <button>
await page.getByRole('button', { name: 'Click me' }).click();
// ✅ Finds the button inside the shadow root
```

### When auto-piercing isn't enough

For closed shadow roots or specific scoping:

```typescript
// Get into a specific shadow root
const host = page.locator('my-button');
const shadowButton = host.locator('button');  // pierces auto
```

---

## Anti-Patterns

```typescript
// ❌ frame.evaluate to find elements
const card = await page.frame({ name: 'payment' }).evaluate(() => {
  return document.querySelector('.card-input');
});

// ✅ Use FrameLocator
const stripe = page.frameLocator('iframe[name="payment"]');
await stripe.getByLabel('Card').fill(...);
```

```typescript
// ❌ Manually waiting for iframe
await page.waitForSelector('iframe[name="payment"]');
const frame = await page.frame({ name: 'payment' });
await frame.waitForSelector('input[name="card"]');

// ✅ FrameLocator auto-waits
await page.frameLocator('iframe[name="payment"]')
  .getByLabel('Card')
  .fill('...');
```

```typescript
// ❌ /deep/ or shadow-piercing CSS (not supported)
await page.locator('shadow-host /deep/ button').click();

// ✅ Just use accessible locators, Playwright pierces automatically
await page.getByRole('button', { name: 'Click me' }).click();
```

---

## Best Practices

1. **`page.frameLocator()` for iframes**, auto-waits, accessible
2. **Don't use `page.frame()`**, older API, no auto-wait
3. **Trust Playwright's shadow DOM piercing**, usually "just works"
4. **For Stripe/payment iframes**, wait for the iframe to be visible first if flaky
5. **Reuse FrameLocator references**, they're lazy, no perf cost
6. **Cross-origin works out of the box**, no extra config

---

## Common Real-World Patterns

### Stripe checkout
```typescript
test('Stripe payment', async ({ page }) => {
  await page.goto('/checkout');

  const stripe = page.frameLocator('iframe[name^="__privateStripeFrame"]');
  await stripe.getByPlaceholder('Card number').fill('4242 4242 4242 4242');
  await stripe.getByPlaceholder('MM / YY').fill('12 / 34');
  await stripe.getByPlaceholder('CVC').fill('123');

  await page.getByRole('button', { name: 'Pay' }).click();
  await expect(page.getByText('Payment successful')).toBeVisible();
});
```

### reCAPTCHA (skip in tests)
Don't try to automate real reCAPTCHA. Instead:
- Use a test key that always passes (`6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`)
- Or mock the reCAPTCHA endpoint via `page.route()`
- Or use a test-mode bypass in your backend

---

## Resources

- https://playwright.dev/docs/api/class-framelocator
- https://playwright.dev/docs/locators#locating-elements-inside-shadow-dom
