import type { CategoryLayoutProps } from "./types";

export function CategoryLayoutResponsive(props: CategoryLayoutProps) {
  const {
    category,
    tenantKey,
    tenantHint,
    products,
    total,
    currentPage,
    totalPages,
    availableAttributes,
  } = props;

  const subcategories = (props as any).subcategories || [];
  const allCategories = (props as any).allCategories || [];
  const tenant = (props as any).tenant || {};
  const businessName =
    tenant.publicProfile?.businessNamFe || tenant.name || "NestCraft";
  const tenantId = tenantHint || tenantKey;
  const currentSlug = category.slug;

  const generateHtml = () => {
    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <style>
      :root {
        --primary: #0d6533; --secondary: #98c45f; --accent: #cfe7b1; --dark: #063a1d; --ring: #98c45f;
        --bg: #ffffff; --surface: #ffffff; --surface-2: #ffffff; --text: #111; --muted-text: #666; --border: rgba(0, 0, 0, 0.12);
        --link: var(--primary); --link-hover: #0a522a;
        --shadow-sm: 0 6px 18px rgba(0, 0, 0, 0.06); --shadow-md: 0 16px 40px rgba(0, 0, 0, 0.1);
        --radius-sm: 10px; --radius-md: 14px; --radius-lg: 18px;
        --font-body: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        --font-heading: "Cormorant Garamond", Georgia, "Times New Roman", serif;
        --announce-h: 36px; --nav-h: 74px; --container-pad: 5%;
        --pagehead-img: url("${category.page?.bannerImage || "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=2000"}");
      }
      [data-theme="light"] { --bg: #f7faf5; --surface: #ffffff; --text: #0b1610; --muted-text: #55685b; --border: rgba(13, 101, 51, 0.14); --nav-bg: rgba(247, 250, 245, 0.82); }
      [data-theme="dark"] { --bg: #06130b; --surface: #0a2013; --text: #eaf4ec; --muted-text: #a9b8ae; --border: rgba(152, 196, 95, 0.22); --nav-bg: rgba(6, 19, 11, 0.72); }
      
      #resp-root { background: var(--bg); color: var(--text); font-family: var(--font-body); margin: 0; min-height: 100vh; }
      #resp-root .container { padding: 0 var(--container-pad); }
      #resp-root .btn { display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 20px; border-radius: 99px; cursor: pointer; font-weight: 700; text-transform: uppercase; font-size: 13px; transition: 0.2s; border: 1px solid transparent; }
      #resp-root .btn-primary { background: var(--primary); color: #fff; }
      #resp-root .btn-primary:hover { background: #0a522a; transform: translateY(-1px); }

      .announce { height: 36px; background: var(--primary); color: #fff; display: flex; align-items: center; overflow: hidden; position: fixed; top: 0; left: 0; right: 0; z-index: 1200; font-size: 11px; }
      .marquee { display: flex; gap: 40px; white-space: nowrap; animation: marquee 20s linear infinite; }
      @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }

      .navbar { height: 74px; display: flex; justify-content: space-between; align-items: center; padding: 0 var(--container-pad); position: fixed; top: 36px; left: 0; right: 0; z-index: 1100; background: var(--nav-bg); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); transition: 0.3s; }
      .navbar.is-scrolled { box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
      .logo { font-family: var(--font-heading); font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
      .nav-links { display: flex; gap: 30px; }
      .nav-links a { color: var(--text); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; }
      .nav-icons { display: flex; gap: 15px; align-items: center; }
      .icon-btn { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: none; border: none; color: var(--text); cursor: pointer; }
      .theme-chip { display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); padding: 5px 12px; border-radius: 20px; cursor: pointer; font-size: 10px; font-weight: 800; background: none; color: var(--text); }

      .mega-wrap { position: relative; }
      .mega-menu { position: absolute; top: 50px; left: 50%; transform: translateX(-50%) translateY(20px); width: 800px; background: var(--surface); border: 1px solid var(--border); border-radius: 15px; padding: 25px; opacity: 0; visibility: hidden; transition: 0.3s; box-shadow: var(--shadow-md); }
      .mega-wrap:hover .mega-menu { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
      .mega-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; }

      .crumbs { margin: 20px 0; font-size: 11px; font-weight: 900; text-transform: uppercase; color: var(--muted-text); }
      .pagehead { height: 250px; border-radius: 20px; overflow: hidden; position: relative; margin-bottom: 30px; border: 1px solid var(--border); }
      .pagehead::before { content: ""; position: absolute; inset: 0; background-image: var(--pagehead-img); background-size: cover; background-position: center; }
      .pagehead::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(247,250,245,1) 0%, rgba(247,250,245,0.7) 100%); }
      [data-theme="dark"] .pagehead::after { background: linear-gradient(90deg, rgba(6,19,11,1) 0%, rgba(6,19,11,0.7) 100%); }
      .pagehead-content { position: relative; z-index: 2; padding: 40px; max-width: 600px; }
      .pagehead h1 { font-family: var(--font-heading); font-size: 44px; margin: 10px 0; }

      .layout { display: grid; grid-template-columns: 300px 1fr; gap: 30px; margin-bottom: 80px; }
      .sidebar { position: sticky; top: 130px; height: fit-content; }
      .filter-card { border: 1px solid var(--border); border-radius: 20px; background: var(--surface); overflow: hidden; }
      .filter-head { padding: 15px; border-bottom: 1px solid var(--border); font-family: var(--font-heading); font-size: 24px; font-weight: 800; display: flex; justify-content: space-between; }
      .filter-block { padding: 15px; border-bottom: 1px solid var(--border); }
      .filter-title { font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px; color: var(--muted-text); }
      .checklist { display: grid; gap: 10px; }
      .check { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; cursor: pointer; }
      .range-row { display: flex; gap: 10px; }
      .mini-input { width: 100%; height: 38px; border-radius: 10px; border: 1px solid var(--border); padding: 0 10px; background: var(--bg); color: var(--text); }

      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
      .card { border: 1px solid var(--border); border-radius: 20px; overflow: hidden; position: relative; background: var(--surface); transition: 0.3s; text-decoration: none; color: inherit; display: block; height: 450px; }
      .card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); border-color: var(--secondary); }
      .card img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
      .card:hover img { transform: scale(1.05); }
      .card-body { position: absolute; bottom: 15px; left: 15px; right: 15px; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); padding: 15px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.5); }
      [data-theme="dark"] .card-body { background: rgba(10,32,19,0.8); }
      .card-name { font-family: var(--font-heading); font-size: 22px; font-weight: 800; margin-bottom: 5px; }
      .card-price { color: var(--secondary); font-weight: 900; }

      footer { background: var(--surface); border-top: 1px solid var(--border); padding: 60px 0; position: relative; overflow: hidden; }
      .footer-grid { display: flex; justify-content: space-between; gap: 50px; flex-wrap: wrap; }
      .watermark { font-family: var(--font-heading); font-size: 15vw; font-weight: 800; color: rgba(0,0,0,0.03); text-align: center; position: absolute; bottom: 10px; left: 0; right: 0; pointer-events: none; user-select: none; font-weight: 800; }
      [data-theme="dark"] .watermark { color: rgba(255,255,255,0.03); }

      @media (max-width: 1024px) { .grid { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } .nav-links { display: none; } }
      @media (max-width: 480px) { .grid { grid-template-columns: 1fr; } }
    </style>
    <div id="resp-root">
      <div class="announce"><div class="marquee"><span><strong>NEW ARRIVALS</strong> SHOP THE COLLECTION • <strong>FREE SHIPPING</strong> OVER ₹9,999 • </span></div></div>
      
      <nav class="navbar" id="nav">
        <div class="logo">${businessName}</div>
        <div class="nav-links">
          <div class="mega-wrap">
            <a href="#">Shop</a>
            <div class="mega-menu">
             
            </div>
          </div>
         
        <div class="nav-icons">
          <div class="theme-chip" id="themeToggle"><span id="themeLabel">Dark</span></div>
          <button class="icon-btn"><i data-lucide="shopping-cart"></i></button>
        </div>
      </nav>

      <main style="padding-top: 130px;" class="container">
        <div class="crumbs">Home / Shop / ${category.name}</div>
        <section class="pagehead">
          <div class="pagehead-content">
            <p style="color:var(--secondary); font-weight:900;">COLLECTION</p>
            <h1>${category.page?.title || category.name}</h1>
            <p style="font-weight:700; color:var(--muted-text);">${category.description || ""}</p>
          </div>
        </section>

        <div class="layout">
          <aside class="sidebar">
            <div class="filter-card">
              <div class="filter-head">Filters <button id="resetBtn" style="font-size:10px; padding:5px; border-radius:5px; border:1px solid var(--border); background:none; cursor:pointer;">Reset</button></div>
              <div class="filter-block">
                <div class="filter-title">Collections</div>
                <div class="checklist">
                  ${allCategories
                    .slice(0, 10)
                    .map(
                      (c: any) => `
                    <label class="check">
                      <input type="checkbox" name="categories" value="${c?.slug ?? ""}" ${c?.slug === currentSlug ? "checked disabled" : ""}> ${c.name}
                    </label>
                  `,
                    )
                    .join("")}
                </div>
              </div>
              <div class="filter-block">
                <div class="filter-title">Price Range</div>
                <div class="range-row">
                  <input type="number" id="minPrice" class="mini-input" placeholder="Min">
                  <input type="number" id="maxPrice" class="mini-input" placeholder="Max">
                </div>
              </div>
              ${availableAttributes
                .map(
                  (attr) => `
                <div class="filter-block">
                  <div class="filter-title">${attr.name}</div>
                  <div class="checklist">
                    ${attr.values
                      .map(
                        (v) => `
                      <label class="check"><input type="checkbox" name="attr_${attr.name}" value="${v}"> ${v}</label>
                    `,
                      )
                      .join("")}
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </aside>

          <section>
            <div class="grid">
              ${products
                .map(
                  (p) => `
                <a href="/product/${tenantId}--${p.slug}" class="card">
                  <img src="${p.primaryImage || "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=600"}">
                  <div class="card-body">
                    <div class="card-name">${p.name}</div>
                    <div class="card-price">₹${p.price?.toLocaleString()}</div>
                  </div>
                </a>
              `,
                )
                .join("")}
            </div>
            ${
              totalPages > 1
                ? `
              <div style="display:flex; justify-content:center; gap:20px; margin-top:40px;">
                 ${currentPage > 1 ? `<button class="btn btn-primary" onclick="setPage(${currentPage - 1})">Prev</button>` : ""}
                 <span style="align-self:center; font-weight:800;">Page ${currentPage} of ${totalPages}</span>
                 ${currentPage < totalPages ? `<button class="btn btn-primary" onclick="setPage(${currentPage + 1})">Next</button>` : ""}
              </div>
            `
                : ""
            }
          </section>
        </div>
      </main>

      <footer>
        <div class="container footer-grid">
          <div>
            <h2 style="font-family:var(--font-heading);">${businessName}</h2>
            <p style="max-width:300px; color:var(--muted-text); font-weight:700;">${tenant.publicProfile?.description || ""}</p>
          </div>
          <div style="display:flex; gap:50px;">
             <div><h5 style="margin-bottom:15px; font-weight:900;">SHOP</h5><ul style="padding:0; list-style:none;"><li>New In</li><li>Best Sellers</li></ul></div>
             <div><h5 style="margin-bottom:15px; font-weight:900;">INFO</h5><ul style="padding:0; list-style:none;"><li>Contact</li><li>Shipping</li></ul></div>
          </div>
        </div>
        <div class="watermark">${businessName.toUpperCase()}</div>
      </footer>

      <script src="https://unpkg.com/lucide@latest"></script>
      <script>
        (function() {
          if (window.lucide) window.lucide.createIcons();
          
          const root = document.documentElement;
          const currentTheme = localStorage.getItem('theme') || 'light';
          root.setAttribute('data-theme', currentTheme);
          document.getElementById('themeLabel').textContent = currentTheme === 'light' ? 'Dark' : 'Light';

          document.getElementById('themeToggle').addEventListener('click', () => {
            const newTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            document.getElementById('themeLabel').textContent = newTheme === 'light' ? 'Dark' : 'Light';
          });

          window.addEventListener('scroll', () => {
            if (window.scrollY > 10) document.getElementById('nav').classList.add('is-scrolled');
            else document.getElementById('nav').classList.remove('is-scrolled');
          });

          function updateQuery() {
            const params = new URLSearchParams(window.location.search);
            const cats = Array.from(document.querySelectorAll('input[name="categories"]:checked:not(:disabled)')).map(c => c.value);
            if (cats.length) params.set('categories', cats.join(',')); else params.delete('categories');
            
            const min = document.getElementById('minPrice').value;
            const max = document.getElementById('maxPrice').value;
            if (min) params.set('minPrice', min); else params.delete('minPrice');
            if (max) params.set('maxPrice', max); else params.delete('maxPrice');

            document.querySelectorAll('input[name^="attr_"]').forEach(cb => {
               const key = cb.name;
               const checked = Array.from(document.querySelectorAll('input[name="'+key+'"]:checked')).map(i => i.value);
               if (checked.length) params.set(key, checked.join(',')); else params.delete(key);
            });

            params.set('page', '1');
            window.location.search = params.toString();
          }

          document.querySelectorAll('input[type="checkbox"]').forEach(i => i.addEventListener('change', updateQuery));
          document.getElementById('minPrice').addEventListener('blur', updateQuery);
          document.getElementById('maxPrice').addEventListener('blur', updateQuery);
          document.getElementById('resetBtn').addEventListener('click', () => window.location.search = '');

          window.setPage = (p) => {
            const params = new URLSearchParams(window.location.search);
            params.set('page', p);
            window.location.search = params.toString();
          };

          // Sync inputs with URL
          const sp = new URLSearchParams(window.location.search);
          document.getElementById('minPrice').value = sp.get('minPrice') || '';
          document.getElementById('maxPrice').value = sp.get('maxPrice') || '';
          sp.get('categories')?.split(',').forEach(c => {
            const input = document.querySelector('input[value="'+c+'"]');
            if (input) input.checked = true;
          });
          for (const [key, val] of sp.entries()) {
            if (key.startsWith('attr_')) {
              val.split(',').forEach(v => {
                const input = document.querySelector('input[name="'+key+'"][value="'+v+'"]');
                if (input) input.checked = true;
              });
            }
          }
        })();
      </script>
    </div>
  </body>
</html>
        `;
  };

  return (
    <div
      id="category-page-wrapper"
      dangerouslySetInnerHTML={{ __html: generateHtml() }}
    />
  );
}
