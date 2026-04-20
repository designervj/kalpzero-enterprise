import type { DiscoveryBindingManifest } from '@/lib/discovery-types';

export type GjsSectionContract = {
  key: string;
  label: string;
  category: string;
  description: string;
  html: string;
};

export type GjsContractBundle = {
  version: string;
  sectionPacks: GjsSectionContract[];
  bindingManifests: DiscoveryBindingManifest[];
};

const CONTRACT_VERSION = '2026-03-07.w2.4';

const SECTION_PACKS: GjsSectionContract[] = [
  {
    key: 'global_header',
    label: 'Global Header',
    category: 'Global',
    description: 'Header navigation with dynamic brand and menu links.',
    html: `
<header class="kalp-header" data-kalp-bind="header.root" style="padding:16px 20px;border-bottom:1px solid #e2e8f0;background:#ffffff;">
  <div style="max-width:1160px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;">
    <a href="/" data-kalp-bind="header.brand.name" style="font-size:20px;font-weight:700;color:#0f172a;text-decoration:none;">Brand Name</a>
    <nav style="display:flex;align-items:center;gap:12px;" data-kalp-repeat="header.nav.items">
      <a href="#" data-kalp-bind="header.nav.item.label" style="font-size:14px;color:#334155;text-decoration:none;">Menu</a>
    </nav>
  </div>
</header>`,
  },
  {
    key: 'hero_primary',
    label: 'Hero Primary',
    category: 'Landing',
    description: 'Primary hero with heading, description, and CTA.',
    html: `
<section class="kalp-hero" data-kalp-bind="hero.root" style="padding:72px 20px;background:#f8fafc;">
  <div style="max-width:1160px;margin:0 auto;">
    <h1 data-kalp-bind="hero.title" style="font-size:46px;line-height:1.1;margin:0 0 12px;">Build your business front page</h1>
    <p data-kalp-bind="hero.subtitle" style="max-width:760px;color:#475569;font-size:18px;margin:0 0 18px;">Use this section for value proposition and trust message.</p>
    <a href="#contact" data-kalp-bind="hero.cta.label" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#0f172a;color:#fff;text-decoration:none;">Get Started</a>
  </div>
</section>`,
  },
  {
    key: 'service_listing_grid',
    label: 'Service Listing Grid',
    category: 'Listing',
    description: 'Dynamic repeat grid for services and features.',
    html: `
<section class="kalp-services" data-kalp-bind="services.root" style="padding:56px 20px;">
  <div style="max-width:1160px;margin:0 auto;">
    <h2 data-kalp-bind="services.title" style="font-size:34px;margin:0 0 12px;">Services</h2>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;" data-kalp-repeat="services.items">
      <article style="border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
        <h3 data-kalp-bind="services.item.title" style="margin:0 0 8px;">Service title</h3>
        <p data-kalp-bind="services.item.description" style="margin:0;color:#64748b;">Service description.</p>
      </article>
    </div>
  </div>
</section>`,
  },
  {
    key: 'category_featured_strip',
    label: 'Category Featured Strip',
    category: 'Listing',
    description: 'Horizontal category strip for discovery and commerce pages.',
    html: `
<section class="kalp-categories" data-kalp-bind="categories.root" style="padding:20px;background:#ffffff;">
  <div style="max-width:1160px;margin:0 auto;display:flex;flex-wrap:wrap;gap:8px;" data-kalp-repeat="categories.items">
    <a href="#" data-kalp-bind="categories.item.label" style="display:inline-block;padding:8px 12px;border-radius:999px;border:1px solid #cbd5e1;color:#334155;text-decoration:none;">Category</a>
  </div>
</section>`,
  },
  {
    key: 'product_listing_grid',
    label: 'Product Listing Grid',
    category: 'Commerce',
    description: 'Dynamic product cards with price and CTA.',
    html: `
<section class="kalp-products" data-kalp-bind="products.root" style="padding:56px 20px;background:#f8fafc;">
  <div style="max-width:1160px;margin:0 auto;">
    <h2 data-kalp-bind="products.title" style="font-size:34px;margin:0 0 14px;">Featured Products</h2>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;" data-kalp-repeat="products.items">
      <article style="border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#fff;">
        <div style="height:160px;border-radius:10px;background:#e2e8f0;margin-bottom:10px;" data-kalp-bind="products.item.image"></div>
        <h3 data-kalp-bind="products.item.name" style="margin:0 0 6px;">Product Name</h3>
        <p data-kalp-bind="products.item.price" style="margin:0;color:#0f766e;font-weight:700;">$99</p>
      </article>
    </div>
  </div>
</section>`,
  },
  {
    key: 'single_product_showcase',
    label: 'Single Product Showcase',
    category: 'Commerce',
    description: 'Detailed product block for single product page.',
    html: `
<section class="kalp-product-single" data-kalp-bind="product.root" style="padding:64px 20px;">
  <div style="max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:20px;">
    <div style="height:360px;background:#e2e8f0;border-radius:16px;" data-kalp-bind="product.image"></div>
    <div>
      <h1 data-kalp-bind="product.name" style="margin:0 0 10px;font-size:40px;line-height:1.1;">Product Name</h1>
      <p data-kalp-bind="product.description" style="margin:0 0 12px;color:#475569;">Product description text.</p>
      <p data-kalp-bind="product.price" style="margin:0 0 18px;font-size:22px;font-weight:700;color:#0f766e;">$149</p>
      <button type="button" data-kalp-bind="product.primaryCta" style="padding:12px 20px;border-radius:10px;border:none;background:#0f172a;color:#fff;">Add To Cart</button>
    </div>
  </div>
</section>`,
  },
  {
    key: 'cart_summary',
    label: 'Cart Summary',
    category: 'Commerce',
    description: 'Cart item list and order totals.',
    html: `
<section class="kalp-cart" data-kalp-bind="cart.root" style="padding:48px 20px;background:#ffffff;">
  <div style="max-width:1080px;margin:0 auto;">
    <h2 data-kalp-bind="cart.title" style="margin:0 0 14px;font-size:30px;">Your Cart</h2>
    <div data-kalp-repeat="cart.items" style="display:grid;gap:10px;margin-bottom:16px;">
      <article style="display:flex;justify-content:space-between;gap:10px;border:1px solid #e2e8f0;border-radius:12px;padding:12px;">
        <span data-kalp-bind="cart.item.name">Product Name</span>
        <span data-kalp-bind="cart.item.price">$99</span>
      </article>
    </div>
    <div style="border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;font-weight:700;">
      <span>Total</span>
      <span data-kalp-bind="cart.total">$299</span>
    </div>
  </div>
</section>`,
  },
  {
    key: 'cart_empty_state',
    label: 'Cart Empty State',
    category: 'Commerce',
    description: 'Empty-cart fallback with primary recovery CTA.',
    html: `
<section class="kalp-cart-empty" data-kalp-bind="cart.emptyState" style="padding:52px 20px;background:#f8fafc;">
  <div style="max-width:760px;margin:0 auto;text-align:center;border:1px dashed #cbd5e1;border-radius:16px;padding:28px;background:#ffffff;">
    <h2 data-kalp-bind="cart.emptyState.title" style="margin:0 0 8px;font-size:30px;">Your cart is empty</h2>
    <p data-kalp-bind="cart.emptyState.description" style="margin:0 0 14px;color:#64748b;">Looks like you have not added any items yet.</p>
    <a href="/discover" data-kalp-bind="cart.emptyState.primaryCta" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;">Browse Products</a>
  </div>
</section>`,
  },
  {
    key: 'checkout_summary',
    label: 'Checkout Summary',
    category: 'Commerce',
    description: 'Checkout trust, totals, and confirmation CTA.',
    html: `
<section class="kalp-checkout" data-kalp-bind="checkout.root" style="padding:48px 20px;background:#f8fafc;">
  <div style="max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1.2fr 0.8fr;gap:16px;">
    <div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fff;">
      <h2 data-kalp-bind="checkout.title" style="margin:0 0 10px;font-size:28px;">Checkout</h2>
      <p data-kalp-bind="checkout.trustNote" style="margin:0;color:#475569;">Secure checkout and verified payment gateway.</p>
    </div>
    <aside style="border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fff;">
      <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#64748b;">Order Summary</p>
      <p data-kalp-bind="checkout.total" style="margin:0 0 12px;font-size:22px;font-weight:700;">$299</p>
      <button type="button" data-kalp-bind="checkout.primaryCta" style="width:100%;padding:10px 14px;border-radius:10px;border:none;background:#0f172a;color:#fff;">Pay Now</button>
    </aside>
  </div>
</section>`,
  },
  {
    key: 'checkout_form_split',
    label: 'Checkout Form Split',
    category: 'Commerce',
    description: 'Two-column shipping and billing form with summary rail.',
    html: `
<section class="kalp-checkout-form" data-kalp-bind="checkout.form" style="padding:48px 20px;background:#ffffff;">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.2fr 0.8fr;gap:16px;">
    <form style="border:1px solid #e2e8f0;border-radius:14px;padding:16px;display:grid;gap:10px;">
      <h3 data-kalp-bind="checkout.form.title" style="margin:0 0 6px;font-size:24px;">Shipping Details</h3>
      <input type="text" placeholder="Full Name" data-kalp-bind="checkout.form.field.name" style="padding:11px;border:1px solid #cbd5e1;border-radius:10px;" />
      <input type="text" placeholder="Address" data-kalp-bind="checkout.form.field.address" style="padding:11px;border:1px solid #cbd5e1;border-radius:10px;" />
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <input type="text" placeholder="City" data-kalp-bind="checkout.form.field.city" style="padding:11px;border:1px solid #cbd5e1;border-radius:10px;" />
        <input type="text" placeholder="Postal Code" data-kalp-bind="checkout.form.field.postalCode" style="padding:11px;border:1px solid #cbd5e1;border-radius:10px;" />
      </div>
    </form>
    <aside style="border:1px solid #e2e8f0;border-radius:14px;padding:16px;background:#f8fafc;">
      <p style="margin:0 0 8px;font-size:12px;color:#64748b;letter-spacing:0.1em;text-transform:uppercase;">Payable Total</p>
      <p data-kalp-bind="checkout.total" style="margin:0 0 10px;font-size:24px;font-weight:700;">$299</p>
      <button type="button" data-kalp-bind="checkout.primaryCta" style="width:100%;padding:11px;border:none;border-radius:10px;background:#0f172a;color:#fff;">Place Order</button>
    </aside>
  </div>
</section>`,
  },
  {
    key: 'checkout_payment_methods',
    label: 'Checkout Payment Methods',
    category: 'Commerce',
    description: 'Payment-method selector with trust notes.',
    html: `
<section class="kalp-payment-methods" data-kalp-bind="checkout.paymentMethods" style="padding:32px 20px;background:#f8fafc;">
  <div style="max-width:1120px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;padding:16px;background:#ffffff;">
    <h3 data-kalp-bind="checkout.paymentMethods.title" style="margin:0 0 10px;font-size:22px;">Payment Method</h3>
    <div style="display:grid;gap:8px;" data-kalp-repeat="checkout.paymentMethods.items">
      <label style="display:flex;align-items:center;gap:8px;border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
        <input type="radio" name="payment" />
        <span data-kalp-bind="checkout.paymentMethods.item.label">UPI / Card / Net Banking</span>
      </label>
    </div>
    <p data-kalp-bind="checkout.paymentMethods.trustNote" style="margin:10px 0 0;font-size:12px;color:#64748b;">Payments are secured with trusted gateway encryption.</p>
  </div>
</section>`,
  },
  {
    key: 'checkout_shipping_methods',
    label: 'Checkout Shipping Methods',
    category: 'Commerce',
    description: 'Shipping options with ETA and delivery notes.',
    html: `
<section class="kalp-shipping-methods" data-kalp-bind="checkout.shippingMethods" style="padding:28px 20px;background:#ffffff;">
  <div style="max-width:1120px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
    <h3 data-kalp-bind="checkout.shippingMethods.title" style="margin:0 0 10px;font-size:22px;">Shipping Method</h3>
    <div style="display:grid;gap:8px;" data-kalp-repeat="checkout.shippingMethods.items">
      <label style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
        <span>
          <input type="radio" name="shipping" />
          <span data-kalp-bind="checkout.shippingMethods.item.label" style="margin-left:8px;">Standard Delivery</span>
          <span data-kalp-bind="checkout.shippingMethods.item.eta" style="display:block;margin-left:24px;font-size:12px;color:#64748b;">3-5 business days</span>
        </span>
        <strong data-kalp-bind="checkout.shippingMethods.item.fee">$0</strong>
      </label>
    </div>
    <p data-kalp-bind="checkout.shippingMethods.note" style="margin:10px 0 0;font-size:12px;color:#64748b;">Delivery timeline may vary by location.</p>
  </div>
</section>`,
  },
  {
    key: 'checkout_status_state',
    label: 'Checkout Status State',
    category: 'Commerce',
    description: 'Order success/error fallback state with next actions.',
    html: `
<section class="kalp-checkout-status" data-kalp-bind="checkout.status" style="padding:48px 20px;background:#f8fafc;">
  <div style="max-width:760px;margin:0 auto;border:1px solid #d1fae5;border-radius:16px;padding:22px;background:#ffffff;">
    <p data-kalp-bind="checkout.status.badge" style="margin:0 0 8px;display:inline-block;padding:4px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-size:11px;">Order Confirmed</p>
    <h2 data-kalp-bind="checkout.status.title" style="margin:0 0 8px;font-size:30px;">Thanks! Your order is placed.</h2>
    <p data-kalp-bind="checkout.status.message" style="margin:0 0 14px;color:#475569;">A confirmation message has been sent with payment details.</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      <a href="/discover" data-kalp-bind="checkout.status.primaryCta" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;">Continue Browsing</a>
      <a href="#" data-kalp-bind="checkout.status.secondaryCta" style="display:inline-block;padding:10px 14px;border-radius:10px;border:1px solid #cbd5e1;color:#334155;text-decoration:none;">Download Invoice</a>
    </div>
  </div>
</section>`,
  },
  {
    key: 'lead_capture_form',
    label: 'Lead Capture Form',
    category: 'Forms',
    description: 'Public lead/contact form block with form bindings.',
    html: `
<section id="contact" class="kalp-form" data-kalp-bind="form.root" style="padding:56px 20px;">
  <div style="max-width:760px;margin:0 auto;">
    <h2 data-kalp-bind="form.title" style="margin:0 0 10px;font-size:32px;">Contact Us</h2>
    <p data-kalp-bind="form.subtitle" style="margin:0 0 12px;color:#475569;">Submit your details and we will get back to you.</p>
    <form data-kalp-bind="form.submit" style="display:grid;gap:10px;">
      <input type="text" name="name" placeholder="Name" data-kalp-bind="form.field.name" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;" />
      <input type="email" name="email" placeholder="Email" data-kalp-bind="form.field.email" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;" />
      <textarea name="message" rows="4" placeholder="Message" data-kalp-bind="form.field.message" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;"></textarea>
      <button type="submit" data-kalp-bind="form.primaryCta" style="padding:12px;border:none;border-radius:10px;background:#0f172a;color:#fff;">Submit</button>
    </form>
  </div>
</section>`,
  },
  {
    key: 'lead_capture_inline_banner',
    label: 'Lead Capture Inline Banner',
    category: 'Forms',
    description: 'Short inline form for newsletter or callback capture.',
    html: `
<section class="kalp-lead-inline" data-kalp-bind="form.inline" style="padding:26px 20px;background:#0f172a;">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.1fr 0.9fr;gap:12px;align-items:center;">
    <div>
      <h3 data-kalp-bind="form.inline.title" style="margin:0;color:#ffffff;font-size:24px;">Get Pricing and Availability</h3>
      <p data-kalp-bind="form.inline.subtitle" style="margin:4px 0 0;color:#cbd5e1;">Drop your contact and we will call back shortly.</p>
    </div>
    <form data-kalp-bind="form.inline.submit" style="display:flex;gap:8px;">
      <input type="tel" name="phone" placeholder="Phone Number" data-kalp-bind="form.inline.field.phone" style="flex:1;padding:11px;border:1px solid #334155;border-radius:10px;background:#0b1220;color:#fff;" />
      <button type="submit" data-kalp-bind="form.inline.primaryCta" style="padding:11px 14px;border:none;border-radius:10px;background:#06b6d4;color:#05252e;font-weight:700;">Request Call</button>
    </form>
  </div>
</section>`,
  },
  {
    key: 'lead_capture_multistep',
    label: 'Lead Capture Multi-step',
    category: 'Forms',
    description: 'Multi-step style form scaffold for higher-intent leads.',
    html: `
<section class="kalp-form-steps" data-kalp-bind="form.steps" style="padding:56px 20px;background:#ffffff;">
  <div style="max-width:900px;margin:0 auto;">
    <h2 data-kalp-bind="form.steps.title" style="margin:0 0 14px;font-size:32px;">Tell us about your project</h2>
    <div style="display:flex;gap:8px;margin-bottom:10px;" data-kalp-repeat="form.steps.progress">
      <span data-kalp-bind="form.steps.progress.item.label" style="display:inline-block;padding:6px 10px;border-radius:999px;background:#e2e8f0;color:#334155;font-size:12px;">Step</span>
    </div>
    <form data-kalp-bind="form.steps.submit" style="display:grid;gap:10px;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
      <input type="text" placeholder="Name" data-kalp-bind="form.steps.field.name" style="padding:11px;border:1px solid #cbd5e1;border-radius:10px;" />
      <input type="email" placeholder="Email" data-kalp-bind="form.steps.field.email" style="padding:11px;border:1px solid #cbd5e1;border-radius:10px;" />
      <select data-kalp-bind="form.steps.field.budget" style="padding:11px;border:1px solid #cbd5e1;border-radius:10px;">
        <option>Budget range</option>
      </select>
      <textarea rows="4" placeholder="Project requirements" data-kalp-bind="form.steps.field.requirements" style="padding:11px;border:1px solid #cbd5e1;border-radius:10px;"></textarea>
      <button type="submit" data-kalp-bind="form.steps.primaryCta" style="padding:11px;border:none;border-radius:10px;background:#0f172a;color:#fff;">Submit Brief</button>
    </form>
  </div>
</section>`,
  },
  {
    key: 'lead_capture_success_state',
    label: 'Lead Capture Success State',
    category: 'Forms',
    description: 'Success confirmation UI after form submission.',
    html: `
<section class="kalp-form-success" data-kalp-bind="form.successState" style="padding:32px 20px;background:#f8fafc;">
  <div style="max-width:760px;margin:0 auto;border:1px solid #bbf7d0;border-radius:14px;padding:18px;background:#ffffff;">
    <p data-kalp-bind="form.successState.badge" style="margin:0 0 8px;display:inline-block;padding:4px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-size:11px;">Submitted</p>
    <h3 data-kalp-bind="form.successState.title" style="margin:0 0 8px;font-size:24px;">Thanks, we received your request.</h3>
    <p data-kalp-bind="form.successState.message" style="margin:0;color:#475569;">Our team will connect shortly with the next steps.</p>
  </div>
</section>`,
  },
  {
    key: 'lead_capture_error_state',
    label: 'Lead Capture Error State',
    category: 'Forms',
    description: 'Validation or submission error state with retry action.',
    html: `
<section class="kalp-form-error" data-kalp-bind="form.errorState" style="padding:32px 20px;background:#fff1f2;">
  <div style="max-width:760px;margin:0 auto;border:1px solid #fecdd3;border-radius:14px;padding:18px;background:#ffffff;">
    <p data-kalp-bind="form.errorState.badge" style="margin:0 0 8px;display:inline-block;padding:4px 10px;border-radius:999px;background:#ffe4e6;color:#9f1239;font-size:11px;">Submission Failed</p>
    <h3 data-kalp-bind="form.errorState.title" style="margin:0 0 8px;font-size:24px;">Please review your details and try again.</h3>
    <p data-kalp-bind="form.errorState.message" style="margin:0 0 12px;color:#475569;">One or more fields are invalid or network failed.</p>
    <button type="button" data-kalp-bind="form.errorState.retryCta" style="padding:10px 14px;border:none;border-radius:10px;background:#0f172a;color:#fff;">Retry Submission</button>
  </div>
</section>`,
  },
  {
    key: 'cart_recommendations',
    label: 'Cart Recommendations',
    category: 'Commerce',
    description: 'Cross-sell block for cart recovery and upsell.',
    html: `
<section class="kalp-cart-recommendations" data-kalp-bind="cart.recommendations" style="padding:36px 20px;background:#ffffff;">
  <div style="max-width:1120px;margin:0 auto;">
    <h3 data-kalp-bind="cart.recommendations.title" style="margin:0 0 12px;font-size:26px;">You may also like</h3>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;" data-kalp-repeat="cart.recommendations.items">
      <article style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;">
        <div style="height:130px;border-radius:10px;background:#e2e8f0;margin-bottom:8px;" data-kalp-bind="cart.recommendations.item.image"></div>
        <h4 data-kalp-bind="cart.recommendations.item.name" style="margin:0 0 4px;">Recommended Product</h4>
        <p data-kalp-bind="cart.recommendations.item.price" style="margin:0;color:#0f766e;font-weight:700;">$49</p>
      </article>
    </div>
  </div>
</section>`,
  },
  {
    key: 'cart_line_item_controls',
    label: 'Cart Line Item Controls',
    category: 'Commerce',
    description: 'Quantity/edit/remove controls for each cart line item.',
    html: `
<section class="kalp-cart-controls" data-kalp-bind="cart.lineItems" style="padding:22px 20px;background:#f8fafc;">
  <div style="max-width:1080px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#ffffff;">
    <h3 data-kalp-bind="cart.lineItems.title" style="margin:0 0 10px;font-size:24px;">Edit Cart Items</h3>
    <div style="display:grid;gap:8px;" data-kalp-repeat="cart.lineItems.items">
      <article style="display:grid;grid-template-columns:1fr auto auto auto;gap:10px;align-items:center;border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
        <span data-kalp-bind="cart.lineItems.item.name">Product Name</span>
        <input type="number" min="1" value="1" data-kalp-bind="cart.lineItems.item.quantity" style="width:64px;padding:7px;border:1px solid #cbd5e1;border-radius:8px;" />
        <span data-kalp-bind="cart.lineItems.item.subtotal">$99</span>
        <button type="button" data-kalp-bind="cart.lineItems.item.removeCta" style="padding:7px 10px;border-radius:8px;border:1px solid #fecaca;background:#fff1f2;color:#9f1239;">Remove</button>
      </article>
    </div>
  </div>
</section>`,
  },
  {
    key: 'header_mega_menu',
    label: 'Header Mega Menu',
    category: 'Global',
    description: 'Global header with top-strip, search, cart, and mega-menu groups.',
    html: `
<header class="kalp-header-mega" data-kalp-bind="header.root" style="border-bottom:1px solid #e2e8f0;background:#ffffff;">
  <div style="padding:8px 20px;background:#0f172a;color:#e2e8f0;">
    <div style="max-width:1160px;margin:0 auto;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
      <span data-kalp-bind="header.top.message" style="font-size:12px;">Free shipping above $99</span>
      <div style="display:flex;gap:10px;" data-kalp-repeat="header.top.links">
        <a href="#" data-kalp-bind="header.top.link.label" style="font-size:12px;color:#e2e8f0;text-decoration:none;">Top Link</a>
      </div>
    </div>
  </div>
  <div style="max-width:1160px;margin:0 auto;padding:14px 20px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;">
    <a href="/" data-kalp-bind="header.brand.name" style="font-size:22px;font-weight:700;color:#0f172a;text-decoration:none;">Brand</a>
    <div style="display:flex;align-items:center;gap:10px;justify-content:center;">
      <input type="search" data-kalp-bind="header.search.input" placeholder="Search products or services" style="width:100%;max-width:360px;padding:9px 11px;border:1px solid #cbd5e1;border-radius:999px;" />
      <button type="button" data-kalp-bind="header.search.cta" style="padding:9px 12px;border:none;border-radius:999px;background:#0f172a;color:#fff;">Search</button>
    </div>
    <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;">
      <a href="#" data-kalp-bind="header.auth.login" style="font-size:13px;color:#334155;text-decoration:none;">Login</a>
      <a href="#" data-kalp-bind="header.cart.cta" style="padding:9px 11px;border-radius:999px;border:1px solid #cbd5e1;color:#0f172a;text-decoration:none;">Cart (0)</a>
    </div>
  </div>
  <nav style="max-width:1160px;margin:0 auto;padding:0 20px 14px;display:flex;gap:10px;flex-wrap:wrap;" data-kalp-repeat="header.megamenu.items">
    <a href="#" data-kalp-bind="header.megamenu.item.label" style="padding:8px 10px;border-radius:8px;background:#f8fafc;color:#334155;text-decoration:none;font-size:13px;">Menu Group</a>
  </nav>
</header>`,
  },
  {
    key: 'footer_multi_column',
    label: 'Footer Multi Column',
    category: 'Global',
    description: 'Global footer with columns, newsletter, and legal links.',
    html: `
<footer class="kalp-footer-columns" data-kalp-bind="footer.root" style="padding:40px 20px;background:#020617;color:#cbd5e1;">
  <div style="max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:14px;">
    <div>
      <h3 data-kalp-bind="footer.brand.name" style="margin:0 0 8px;font-size:20px;color:#f8fafc;">Brand</h3>
      <p data-kalp-bind="footer.brand.summary" style="margin:0;font-size:13px;color:#94a3b8;">Creative business pages and discovery platform.</p>
    </div>
    <div data-kalp-repeat="footer.columns.items">
      <h4 data-kalp-bind="footer.columns.item.title" style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:#f8fafc;">Column</h4>
      <a href="#" data-kalp-bind="footer.columns.item.link" style="display:block;margin-bottom:6px;font-size:13px;color:#cbd5e1;text-decoration:none;">Link</a>
    </div>
    <div style="grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px solid #1e293b;padding-top:14px;flex-wrap:wrap;">
      <span data-kalp-bind="footer.copy" style="font-size:12px;color:#94a3b8;">Copyright 2026</span>
      <div style="display:flex;gap:8px;" data-kalp-repeat="footer.legal.links">
        <a href="#" data-kalp-bind="footer.legal.link.label" style="font-size:12px;color:#cbd5e1;text-decoration:none;">Privacy</a>
      </div>
    </div>
  </div>
</footer>`,
  },
  {
    key: 'proposal_cover',
    label: 'Proposal Cover + Scope',
    category: 'Documents',
    description: 'Proposal starter layout for gigs/services with timeline and pricing summary.',
    html: `
<section class="kalp-proposal" data-kalp-bind="proposal.root" style="padding:34px 20px;background:#f8fafc;">
  <div style="max-width:980px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;padding:22px;background:#ffffff;">
    <p data-kalp-bind="proposal.kicker" style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">Business Proposal</p>
    <h2 data-kalp-bind="proposal.title" style="margin:0 0 8px;font-size:34px;">Website Revamp + Growth Plan</h2>
    <p data-kalp-bind="proposal.client" style="margin:0 0 12px;color:#475569;">Prepared for Client Name</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;" data-kalp-repeat="proposal.highlights">
      <article style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
        <p data-kalp-bind="proposal.highlight.title" style="margin:0 0 4px;font-size:12px;color:#64748b;">Timeline</p>
        <strong data-kalp-bind="proposal.highlight.value">4 weeks</strong>
      </article>
    </div>
  </div>
</section>`,
  },
  {
    key: 'catalog_showcase_grid',
    label: 'Catalog Showcase Grid',
    category: 'Documents',
    description: 'Printable/catalog-friendly product cards with image, SKU, and CTA.',
    html: `
<section class="kalp-catalog-grid" data-kalp-bind="catalog.root" style="padding:30px 20px;background:#ffffff;">
  <div style="max-width:1080px;margin:0 auto;">
    <h2 data-kalp-bind="catalog.title" style="margin:0 0 12px;font-size:30px;">Product Catalog</h2>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;" data-kalp-repeat="catalog.items">
      <article style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;">
        <div style="height:130px;border-radius:8px;background:#e2e8f0;margin-bottom:8px;" data-kalp-bind="catalog.item.image"></div>
        <h3 data-kalp-bind="catalog.item.name" style="margin:0 0 4px;font-size:16px;">Catalog Item</h3>
        <p data-kalp-bind="catalog.item.meta" style="margin:0 0 6px;font-size:12px;color:#64748b;">SKU-1001</p>
        <strong data-kalp-bind="catalog.item.price">$99</strong>
      </article>
    </div>
  </div>
</section>`,
  },
  {
    key: 'invoice_standard',
    label: 'Invoice Standard',
    category: 'Documents',
    description: 'Invoice layout with line items, subtotal/tax/total and payment notes.',
    html: `
<section class="kalp-invoice" data-kalp-bind="invoice.root" style="padding:36px 20px;background:#f8fafc;">
  <div style="max-width:940px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;padding:18px;background:#ffffff;">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
      <h2 data-kalp-bind="invoice.title" style="margin:0;font-size:28px;">Invoice</h2>
      <p data-kalp-bind="invoice.number" style="margin:0;color:#475569;">INV-2026-001</p>
    </div>
    <div style="display:grid;gap:8px;" data-kalp-repeat="invoice.items">
      <article style="display:grid;grid-template-columns:1fr auto auto;gap:10px;border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
        <span data-kalp-bind="invoice.item.name">Service Item</span>
        <span data-kalp-bind="invoice.item.qty">1</span>
        <strong data-kalp-bind="invoice.item.total">$120</strong>
      </article>
    </div>
    <div style="margin-top:12px;display:grid;gap:4px;justify-content:end;text-align:right;">
      <span data-kalp-bind="invoice.subtotal">Subtotal: $120</span>
      <span data-kalp-bind="invoice.tax">Tax: $0</span>
      <strong data-kalp-bind="invoice.total">Total: $120</strong>
    </div>
  </div>
</section>`,
  },
  {
    key: 'email_campaign_newsletter',
    label: 'Email Campaign Newsletter',
    category: 'Documents',
    description: 'Email HTML block for campaign/newsletter workflows.',
    html: `
<section class="kalp-email-template" data-kalp-bind="email.root" style="padding:24px;background:#e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;">
    <tr><td style="padding:18px;background:#0f172a;color:#ffffff;">
      <h2 data-kalp-bind="email.header.title" style="margin:0;font-size:22px;">Monthly Highlights</h2>
    </td></tr>
    <tr><td style="padding:18px;">
      <p data-kalp-bind="email.body.summary" style="margin:0 0 10px;color:#334155;">Share updates, offers, and featured work here.</p>
      <a href="#" data-kalp-bind="email.body.cta" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#0f172a;color:#ffffff;text-decoration:none;">Read More</a>
    </td></tr>
    <tr><td style="padding:14px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;" data-kalp-bind="email.footer.copy">You are receiving this email because you subscribed.</td></tr>
  </table>
</section>`,
  },
  {
    key: 'cart_coupon_panel',
    label: 'Cart Coupon Panel',
    category: 'Commerce',
    description: 'Coupon entry and discount summary panel for cart/checkout.',
    html: `
<section class="kalp-cart-coupon" data-kalp-bind="cart.coupon" style="padding:22px 20px;background:#ffffff;">
  <div style="max-width:1080px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;padding:14px;">
    <h3 data-kalp-bind="cart.coupon.title" style="margin:0 0 8px;font-size:22px;">Apply Coupon</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <input type="text" data-kalp-bind="cart.coupon.code" placeholder="Enter coupon code" style="flex:1;min-width:220px;padding:10px;border:1px solid #cbd5e1;border-radius:10px;" />
      <button type="button" data-kalp-bind="cart.coupon.applyCta" style="padding:10px 14px;border:none;border-radius:10px;background:#0f172a;color:#fff;">Apply</button>
    </div>
    <p data-kalp-bind="cart.coupon.summary" style="margin:10px 0 0;font-size:12px;color:#475569;">Discount will be reflected in order summary.</p>
  </div>
</section>`,
  },
  {
    key: 'checkout_address_book',
    label: 'Checkout Address Book',
    category: 'Commerce',
    description: 'Saved address selection + add new address action.',
    html: `
<section class="kalp-checkout-addresses" data-kalp-bind="checkout.addresses" style="padding:26px 20px;background:#f8fafc;">
  <div style="max-width:1120px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#ffffff;">
    <h3 data-kalp-bind="checkout.addresses.title" style="margin:0 0 10px;font-size:22px;">Delivery Address</h3>
    <div style="display:grid;gap:8px;" data-kalp-repeat="checkout.addresses.items">
      <label style="display:flex;gap:10px;border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
        <input type="radio" name="address" />
        <span>
          <strong data-kalp-bind="checkout.addresses.item.label">Home</strong>
          <span data-kalp-bind="checkout.addresses.item.value" style="display:block;font-size:12px;color:#64748b;">Street, City, ZIP</span>
        </span>
      </label>
    </div>
    <button type="button" data-kalp-bind="checkout.addresses.addCta" style="margin-top:10px;padding:9px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#ffffff;color:#334155;">Add New Address</button>
  </div>
</section>`,
  },
  {
    key: 'checkout_order_notes',
    label: 'Checkout Order Notes',
    category: 'Commerce',
    description: 'Optional checkout notes/instructions block.',
    html: `
<section class="kalp-checkout-notes" data-kalp-bind="checkout.notes" style="padding:22px 20px;background:#ffffff;">
  <div style="max-width:1120px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;padding:14px;">
    <h3 data-kalp-bind="checkout.notes.title" style="margin:0 0 8px;font-size:22px;">Order Notes</h3>
    <textarea rows="4" data-kalp-bind="checkout.notes.input" placeholder="Delivery instructions, preferred slot, custom note..." style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:10px;"></textarea>
  </div>
</section>`,
  },
  {
    key: 'lead_capture_file_upload',
    label: 'Lead Capture File Upload',
    category: 'Forms',
    description: 'Lead form variant with file attachment input (briefs/docs).',
    html: `
<section class="kalp-form-upload" data-kalp-bind="form.upload" style="padding:40px 20px;background:#f8fafc;">
  <div style="max-width:820px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;padding:16px;background:#ffffff;">
    <h3 data-kalp-bind="form.upload.title" style="margin:0 0 8px;font-size:26px;">Share your brief</h3>
    <p data-kalp-bind="form.upload.subtitle" style="margin:0 0 10px;color:#64748b;">Attach requirement documents and we will review quickly.</p>
    <form data-kalp-bind="form.upload.submit" style="display:grid;gap:10px;">
      <input type="text" data-kalp-bind="form.upload.field.name" placeholder="Name" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px;" />
      <input type="email" data-kalp-bind="form.upload.field.email" placeholder="Email" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px;" />
      <input type="file" data-kalp-bind="form.upload.field.file" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px;" />
      <button type="submit" data-kalp-bind="form.upload.primaryCta" style="padding:10px 14px;border:none;border-radius:10px;background:#0f172a;color:#fff;">Submit Brief</button>
    </form>
  </div>
</section>`,
  },
  {
    key: 'booking_widget',
    label: 'Booking Widget',
    category: 'Services',
    description: 'Interactive booking calendar for professional services.',
    html: `
<section class="kalp-booking-widget" data-kalp-bind="booking.root" style="padding:48px 20px;background:#f8fafc;">
  <div style="max-width:820px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;padding:24px;background:#ffffff;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
    <h2 data-kalp-bind="booking.title" style="margin:0 0 8px;font-size:28px;">Book an Appointment</h2>
    <p data-kalp-bind="booking.subtitle" style="margin:0 0 24px;color:#475569;">Select a service and find an available time slot below.</p>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <h3 style="margin:0;font-size:16px;">1. Select Service</h3>
        <select data-kalp-bind="booking.services" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;width:100%;">
          <option>Select a service...</option>
        </select>
        <div style="margin-top:10px;padding:12px;border-radius:10px;background:#f0fdfa;border:1px solid #ccfbf1;">
          <h4 data-kalp-bind="booking.selectedService.name" style="margin:0 0 4px;font-size:14px;color:#0f766e;">Service Name</h4>
          <p data-kalp-bind="booking.selectedService.price" style="margin:0;font-size:16px;font-weight:bold;color:#115e59;">Price on select</p>
        </div>
      </div>
      
      <div style="display:flex;flex-direction:column;gap:12px;">
        <h3 style="margin:0;font-size:16px;">2. Select Date & Time</h3>
        <input type="date" data-kalp-bind="booking.date" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;width:100%;" />
        <select data-kalp-bind="booking.timeSlots" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;width:100%;">
          <option>Select time...</option>
        </select>
      </div>
    </div>
    
    <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:24px;">
      <form data-kalp-bind="booking.submit" style="display:grid;gap:12px;">
        <input type="text" placeholder="Full Name" data-kalp-bind="booking.field.name" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;" />
        <input type="email" placeholder="Email Address" data-kalp-bind="booking.field.email" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;" />
        <button type="submit" data-kalp-bind="booking.primaryCta" style="padding:14px;border:none;border-radius:10px;background:#0f172a;color:#fff;font-weight:bold;font-size:16px;">Confirm Booking</button>
      </form>
    </div>
  </div>
</section>`,
  },
  {
    key: 'global_footer',
    label: 'Global Footer',
    category: 'Global',
    description: 'Footer links, legal text, and social handles.',
    html: `
<footer class="kalp-footer" data-kalp-bind="footer.root" style="padding:28px 20px;border-top:1px solid #e2e8f0;background:#ffffff;">
  <div style="max-width:1160px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
    <span data-kalp-bind="footer.copy" style="font-size:13px;color:#64748b;">Copyright 2026 Your Brand</span>
    <div style="display:flex;gap:10px;" data-kalp-repeat="footer.links">
      <a href="#" data-kalp-bind="footer.link.label" style="font-size:13px;color:#334155;text-decoration:none;">Footer Link</a>
    </div>
  </div>
</footer>`,
  },
];

const BINDING_MANIFESTS: DiscoveryBindingManifest[] = [
  {
    version: CONTRACT_VERSION,
    templateKey: 'business_profile_default',
    routeType: 'business_profile',
    bindings: [
      { key: 'brand_name', selector: '[data-kalp-bind="header.brand.name"]', source: 'business.name', fallback: 'Business Name' },
      { key: 'hero_title', selector: '[data-kalp-bind="hero.title"]', source: 'business.publicProfile.headline', fallback: 'Business headline' },
      { key: 'hero_subtitle', selector: '[data-kalp-bind="hero.subtitle"]', source: 'business.publicProfile.summary', fallback: 'Business summary' },
    ],
    collections: [
      { key: 'featured_products', selector: '[data-kalp-repeat="products.items"]', source: 'business.featuredProducts' },
      { key: 'featured_portfolio', selector: '[data-kalp-repeat="services.items"]', source: 'business.featuredPortfolio' },
    ],
    requiredFields: ['business.name', 'business.publicProfile.slug'],
    seoBindings: {
      title: 'business.seo.title',
      description: 'business.seo.description',
      canonicalUrl: 'business.canonicalPath',
      robots: 'business.seo.robots',
    },
  },
  {
    version: CONTRACT_VERSION,
    templateKey: 'category_page_default',
    routeType: 'category_page',
    bindings: [
      { key: 'category_title', selector: '[data-kalp-bind="hero.title"]', source: 'category.page.title', fallback: 'Category title' },
      { key: 'category_desc', selector: '[data-kalp-bind="hero.subtitle"]', source: 'category.description', fallback: 'Category description' },
    ],
    collections: [
      { key: 'category_products', selector: '[data-kalp-repeat="products.items"]', source: 'category.products' },
    ],
    requiredFields: ['category.slug', 'category.page.title'],
    seoBindings: {
      title: 'category.page.seo.metaTitle',
      description: 'category.page.seo.metaDescription',
      canonicalUrl: 'category.canonicalPath',
      robots: 'category.seo.robots',
    },
  },
  {
    version: CONTRACT_VERSION,
    templateKey: 'product_page_default',
    routeType: 'product_page',
    bindings: [
      { key: 'product_name', selector: '[data-kalp-bind="product.name"]', source: 'product.name', fallback: 'Product name' },
      { key: 'product_price', selector: '[data-kalp-bind="product.price"]', source: 'product.priceLabel', fallback: 'Price on request' },
      { key: 'product_desc', selector: '[data-kalp-bind="product.description"]', source: 'product.description', fallback: 'Product description' },
    ],
    collections: [],
    requiredFields: ['product.slug', 'product.name'],
    seoBindings: {
      title: 'product.seo.title',
      description: 'product.seo.description',
      canonicalUrl: 'product.canonicalPath',
      robots: 'product.seo.robots',
    },
  },
  {
    version: CONTRACT_VERSION,
    templateKey: 'cart_page_default',
    routeType: 'cart_page',
    bindings: [
      { key: 'cart_title', selector: '[data-kalp-bind="cart.title"]', source: 'cart.title', fallback: 'Your Cart' },
      { key: 'cart_total', selector: '[data-kalp-bind="cart.total"]', source: 'cart.totalLabel', fallback: '$0' },
    ],
    collections: [
      { key: 'cart_items', selector: '[data-kalp-repeat="cart.items"]', source: 'cart.items' },
    ],
    requiredFields: ['cart.items'],
    seoBindings: {
      title: 'cart.seo.title',
      description: 'cart.seo.description',
      canonicalUrl: 'cart.canonicalPath',
      robots: 'cart.seo.robots',
    },
  },
  {
    version: CONTRACT_VERSION,
    templateKey: 'checkout_page_default',
    routeType: 'checkout_page',
    bindings: [
      { key: 'checkout_title', selector: '[data-kalp-bind="checkout.title"]', source: 'checkout.title', fallback: 'Checkout' },
      { key: 'checkout_total', selector: '[data-kalp-bind="checkout.total"]', source: 'checkout.totalLabel', fallback: '$0' },
    ],
    collections: [],
    requiredFields: ['checkout.total'],
    seoBindings: {
      title: 'checkout.seo.title',
      description: 'checkout.seo.description',
      canonicalUrl: 'checkout.canonicalPath',
      robots: 'checkout.seo.robots',
    },
  },
  {
    version: CONTRACT_VERSION,
    templateKey: 'discovery_page_default',
    routeType: 'discovery_page',
    bindings: [
      { key: 'discovery_title', selector: '[data-kalp-bind="hero.title"]', source: 'discovery.page.seo.title', fallback: 'Discover Businesses' },
      { key: 'discovery_desc', selector: '[data-kalp-bind="hero.subtitle"]', source: 'discovery.page.seo.description', fallback: 'Browse listed businesses.' },
    ],
    collections: [
      { key: 'discovery_items', selector: '[data-kalp-repeat="services.items"]', source: 'discovery.items' },
    ],
    requiredFields: ['discovery.page.routePath'],
    seoBindings: {
      title: 'discovery.page.seo.title',
      description: 'discovery.page.seo.description',
      canonicalUrl: 'discovery.page.seo.canonicalUrl',
      robots: 'discovery.page.seo.robots',
    },
  },
];

function cloneManifest<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getDefaultGjsSectionPacks(): GjsSectionContract[] {
  return SECTION_PACKS.map((section) => ({ ...section }));
}

export function getDefaultDiscoveryBindingManifests(): DiscoveryBindingManifest[] {
  return BINDING_MANIFESTS.map((item) => cloneManifest(item));
}

export function getGjsContractBundle(): GjsContractBundle {
  return {
    version: CONTRACT_VERSION,
    sectionPacks: getDefaultGjsSectionPacks(),
    bindingManifests: getDefaultDiscoveryBindingManifests(),
  };
}
