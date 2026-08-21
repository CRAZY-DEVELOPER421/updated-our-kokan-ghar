const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Normalize DATETIME to ISO strings so the storefront countdown parses
// consistently across browsers (new Date('YYYY-MM-DD HH:MM:SS') is invalid in Safari).
const normalizeCampaign = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  tagline: row.tagline,
  description: row.description,
  theme_color: row.theme_color || '#2D6A4F',
  banner_image_url: row.banner_image_url,
  mobile_banner_image_url: row.mobile_banner_image_url,
  // Page-level background (v2 — sections)
  page_bg_type: row.page_bg_type || 'transparent',
  page_bg_color: row.page_bg_color || null,
  page_bg_image: row.page_bg_image || null,
  page_bg_video: row.page_bg_video || null,
  meta_title: row.meta_title,
  meta_description: row.meta_description,
  starts_at: row.starts_at ? new Date(row.starts_at).toISOString() : null,
  ends_at: row.ends_at ? new Date(row.ends_at).toISOString() : null,
  is_active: !!row.is_active,
  sort_order: row.sort_order,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const PRODUCT_SELECT = `
  p.*, c.name as category_name, c.slug as category_slug,
  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image`;

// Attach active flash-sale info so ProductCard shows sale pricing,
// "Flash Sale" badges and scarcity bars on campaign pages too.
const attachFlashSales = async (products) => {
  if (!products.length) return products;
  const [flashSales] = await pool.query(
    `SELECT product_id, sale_price, original_price, quantity_limit, sold_count, starts_at, ends_at
     FROM flash_sales
     WHERE is_active = 1 AND NOW() BETWEEN starts_at AND ends_at`
  );
  const flashMap = new Map(flashSales.map((fs) => [Number(fs.product_id), fs]));
  return products.map((product) => {
    const fs = flashMap.get(Number(product.id));
    if (fs) {
      product.flash_sale = {
        sale_price: fs.sale_price,
        original_price: fs.original_price,
        quantity_limit: fs.quantity_limit,
        sold_count: fs.sold_count,
        ends_at: fs.ends_at ? new Date(fs.ends_at).toISOString() : null,
      };
    }
    return product;
  });
};

const normalizeSection = (row) => ({
  id: row.id,
  section_type: row.section_type,
  title: row.title,
  subtitle: row.subtitle,
  content: row.content,
  layout: row.layout || 'grid',
  bg_type: row.bg_type || 'transparent',
  bg_color: row.bg_color,
  bg_image: row.bg_image,
  bg_video: row.bg_video,
});

// Load sections for a campaign, each with its products (full rows) and blogs.
const loadSections = async (campaignId) => {
  const [sectionRows] = await pool.query(
    `SELECT * FROM campaign_sections
     WHERE campaign_id = ? AND is_active = 1
     ORDER BY sort_order ASC, id ASC`,
    [campaignId]
  );
  if (sectionRows.length === 0) return [];

  const sections = sectionRows.map(normalizeSection);

  // Products per section (full product rows, ordered)
  for (const section of sections) {
    section.products = [];
    section.blogs = [];
  }
  const sectionById = new Map(sections.map((s) => [Number(s.id), s]));

  const [productRows] = await pool.query(
    `SELECT sp.section_id, ${PRODUCT_SELECT}
     FROM campaign_section_products sp
     JOIN products p ON p.id = sp.product_id
     JOIN categories c ON p.category_id = c.id
     WHERE sp.section_id IN (?) AND p.is_active = 1
     ORDER BY sp.sort_order ASC, sp.id ASC`,
    [sections.map((s) => s.id)]
  );
  for (const row of productRows) {
    const section = sectionById.get(Number(row.section_id));
    if (section) {
      const { section_id, ...product } = row;
      section.products.push(product);
    }
  }

  const [blogRows] = await pool.query(
    `SELECT sb.section_id, b.id, b.title, b.slug, b.excerpt, b.hero_image,
            b.published_at, b.view_count, bc.name as category_name
     FROM campaign_section_blogs sb
     JOIN blogs b ON b.id = sb.blog_id
     LEFT JOIN blog_categories bc ON b.category_id = bc.id
     WHERE sb.section_id IN (?) AND b.is_published = 1
     ORDER BY sb.sort_order ASC, sb.id ASC`,
    [sections.map((s) => s.id)]
  );
  for (const row of blogRows) {
    const section = sectionById.get(Number(row.section_id));
    if (section) {
      const { section_id, ...blog } = row;
      section.blogs.push({
        ...blog,
        published_at: blog.published_at ? new Date(blog.published_at).toISOString() : null,
      });
    }
  }

  // Attach flash-sale pricing to every products section
  const allProducts = sections.flatMap((s) => s.products);
  const withFlash = await attachFlashSales(allProducts);
  let i = 0;
  for (const section of sections) {
    section.products = withFlash.slice(i, i + section.products.length);
    i += section.products.length;
  }

  return sections;
};

// Legacy campaigns (created before the section builder) still have their
// products in campaign_products — render them as one default products section.
const legacyFallbackSection = async (campaignId, campaignName) => {
  const [products] = await pool.query(
    `SELECT ${PRODUCT_SELECT}
     FROM campaign_products cp
     JOIN products p ON p.id = cp.product_id
     JOIN categories c ON p.category_id = c.id
     WHERE cp.campaign_id = ? AND p.is_active = 1
     ORDER BY cp.sort_order ASC, p.name ASC`,
    [campaignId]
  );
  return [{
    id: null,
    section_type: 'products',
    title: campaignName,
    subtitle: null,
    content: null,
    layout: 'grid',
    bg_type: 'transparent',
    bg_color: null,
    bg_image: null,
    bg_video: null,
    products: await attachFlashSales(products),
    blogs: [],
  }];
};

// ===== PUBLIC =====

// Active campaigns in menu order (for a "Festive Collections" strip etc.)
const getActiveCampaigns = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM campaigns
     WHERE is_active = 1
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())
     ORDER BY sort_order ASC, id ASC`
  );
  return ApiResponse.success(res, { campaigns: rows.map(normalizeCampaign) });
});

// Single campaign page: campaign + ordered sections (products / story / blog / overview)
const getCampaignBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const [campaignRows] = await pool.query(
    `SELECT * FROM campaigns WHERE slug = ? AND is_active = 1
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())`,
    [slug]
  );
  if (campaignRows.length === 0) {
    return ApiResponse.error(res, 'Campaign not found.', 404);
  }
  const campaign = normalizeCampaign(campaignRows[0]);

  let sections = await loadSections(campaign.id);
  if (sections.length === 0) {
    sections = await legacyFallbackSection(campaign.id, campaign.name);
  }
  campaign.sections = sections;

  return ApiResponse.success(res, { campaign });
});

// ===== ADMIN =====

// Lightweight per-campaign preview data for the admin list thumbnails:
// section types + up to 5 primary product images per products section.
const attachCampaignPreviews = async (campaigns) => {
  if (campaigns.length === 0) return;
  const ids = campaigns.map((c) => c.id);

  const previewMap = new Map(ids.map((i) => [Number(i), []]));

  const [sectionRows] = await pool.query(
    `SELECT id, campaign_id, section_type, layout
     FROM campaign_sections
     WHERE campaign_id IN (?)
     ORDER BY sort_order ASC, id ASC`,
    [ids]
  );

  if (sectionRows.length > 0) {
    const entries = sectionRows.map((s) => ({
      sectionId: Number(s.id),
      campaignId: Number(s.campaign_id),
      section_type: s.section_type,
      layout: s.layout,
      product_images: [],
    }));
    const entryBySectionId = new Map(entries.map((e) => [e.sectionId, e]));

    const [prodRows] = await pool.query(
      `SELECT sp.section_id,
         (SELECT image_url FROM product_images WHERE product_id = sp.product_id AND is_primary = 1 LIMIT 1) as image_url
       FROM campaign_section_products sp
       WHERE sp.section_id IN (?)
       ORDER BY sp.sort_order ASC, sp.id ASC`,
      [entries.map((e) => e.sectionId)]
    );
    for (const row of prodRows) {
      const entry = entryBySectionId.get(Number(row.section_id));
      if (entry && row.image_url && entry.product_images.length < 5) {
        entry.product_images.push(row.image_url);
      }
    }

    for (const e of entries) {
      previewMap.get(e.campaignId)?.push({
        section_type: e.section_type,
        layout: e.layout,
        product_images: e.product_images,
      });
    }
  }

  // Legacy campaigns (no sections) → one products section from campaign_products
  const legacyCampaigns = campaigns.filter((c) => (previewMap.get(Number(c.id)) || []).length === 0);
  if (legacyCampaigns.length > 0) {
    for (const c of legacyCampaigns) {
      previewMap.set(Number(c.id), [{ section_type: 'products', layout: 'grid', product_images: [] }]);
    }
    const [legacyRows] = await pool.query(
      `SELECT cp.campaign_id,
         (SELECT image_url FROM product_images WHERE product_id = cp.product_id AND is_primary = 1 LIMIT 1) as image_url
       FROM campaign_products cp
       WHERE cp.campaign_id IN (?)
       ORDER BY cp.sort_order ASC, cp.id ASC`,
      [legacyCampaigns.map((c) => c.id)]
    );
    for (const row of legacyRows) {
      const entry = previewMap.get(Number(row.campaign_id))?.[0];
      if (entry && row.image_url && entry.product_images.length < 5) {
        entry.product_images.push(row.image_url);
      }
    }
  }

  for (const c of campaigns) {
    c.preview = { sections: previewMap.get(Number(c.id)) || [] };
  }
};

const getCampaigns = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.*,
       (SELECT COUNT(*) FROM campaign_section_products sp
         JOIN campaign_sections s ON sp.section_id = s.id
        WHERE s.campaign_id = c.id) +
       (SELECT COUNT(*) FROM campaign_products cp WHERE cp.campaign_id = c.id) as product_count,
       (SELECT COUNT(*) FROM campaign_sections s WHERE s.campaign_id = c.id) as section_count
     FROM campaigns c
     ORDER BY c.sort_order ASC, c.id DESC`
  );
  const campaigns = rows.map(normalizeCampaign);
  await attachCampaignPreviews(campaigns);
  return ApiResponse.success(res, { campaigns });
});

const getCampaignById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM campaigns WHERE id = ?', [id]);
  if (rows.length === 0) {
    return ApiResponse.error(res, 'Campaign not found.', 404);
  }
  const campaign = normalizeCampaign(rows[0]);

  // Sections with light-weight product/blog info for the admin form
  const [sectionRows] = await pool.query(
    `SELECT * FROM campaign_sections
     WHERE campaign_id = ? ORDER BY sort_order ASC, id ASC`,
    [id]
  );
  const sections = sectionRows.map(normalizeSection);

  const sectionById = new Map(sections.map((s) => [Number(s.id), s]));
  for (const section of sections) {
    section.products = [];
    section.product_ids = [];
    section.blogs = [];
    section.blog_ids = [];
  }

  if (sections.length > 0) {
    const [productRows] = await pool.query(
      `SELECT sp.section_id, sp.product_id, p.name, p.price, p.mrp, p.sku,
         (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM campaign_section_products sp
       JOIN products p ON p.id = sp.product_id
       WHERE sp.section_id IN (?)
       ORDER BY sp.sort_order ASC, sp.id ASC`,
      [sections.map((s) => s.id)]
    );
    for (const row of productRows) {
      const section = sectionById.get(Number(row.section_id));
      if (!section) continue;
      section.products.push({
        product_id: row.product_id, name: row.name, price: row.price,
        mrp: row.mrp, sku: row.sku, primary_image: row.primary_image,
      });
      section.product_ids.push(Number(row.product_id));
    }

    const [blogRows] = await pool.query(
      `SELECT sb.section_id, sb.blog_id, b.title, b.slug, b.hero_image, b.excerpt
       FROM campaign_section_blogs sb
       JOIN blogs b ON b.id = sb.blog_id
       WHERE sb.section_id IN (?)
       ORDER BY sb.sort_order ASC, sb.id ASC`,
      [sections.map((s) => s.id)]
    );
    for (const row of blogRows) {
      const section = sectionById.get(Number(row.section_id));
      if (!section) continue;
      section.blogs.push({
        blog_id: row.blog_id, title: row.title, slug: row.slug,
        hero_image: row.hero_image, excerpt: row.excerpt,
      });
      section.blog_ids.push(Number(row.blog_id));
    }
  }

  campaign.sections = sections;

  // Legacy curated products (kept for backward compat with pre-section data)
  const [productRows] = await pool.query(
    `SELECT cp.product_id, cp.sort_order, p.name, p.price, p.mrp, p.sku,
       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM campaign_products cp
     JOIN products p ON p.id = cp.product_id
     WHERE cp.campaign_id = ?
     ORDER BY cp.sort_order ASC, cp.id ASC`,
    [id]
  );
  campaign.products = productRows;
  campaign.product_ids = productRows.map((r) => Number(r.product_id));

  return ApiResponse.success(res, { campaign });
});

// Insert a section + its products/blogs inside an open transaction
const insertSection = async (connection, campaignId, section, sortOrder) => {
  const [result] = await connection.query(
    `INSERT INTO campaign_sections
      (campaign_id, section_type, title, subtitle, content, layout,
       bg_type, bg_color, bg_image, bg_video, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      campaignId,
      section.section_type || 'products',
      section.title || null,
      section.subtitle || null,
      section.content || null,
      section.layout === 'scroll' ? 'scroll' : 'grid',
      section.bg_type || 'transparent',
      section.bg_color || null,
      section.bg_image || null,
      section.bg_video || null,
      sortOrder,
    ]
  );
  const sectionId = result.insertId;

  const productIds = Array.isArray(section.product_ids) ? section.product_ids : [];
  for (let i = 0; i < productIds.length; i++) {
    await connection.query(
      'INSERT INTO campaign_section_products (section_id, product_id, sort_order) VALUES (?, ?, ?)',
      [sectionId, productIds[i], i]
    );
  }

  const blogIds = Array.isArray(section.blog_ids) ? section.blog_ids : [];
  for (let i = 0; i < blogIds.length; i++) {
    await connection.query(
      'INSERT INTO campaign_section_blogs (section_id, blog_id, sort_order) VALUES (?, ?, ?)',
      [sectionId, blogIds[i], i]
    );
  }

  return sectionId;
};

const createCampaign = asyncHandler(async (req, res) => {
  const {
    name, slug, tagline, description, theme_color, banner_image_url,
    mobile_banner_image_url, meta_title, meta_description,
    starts_at, ends_at, is_active = 1, sort_order = 0,
    product_ids = [], sections,
    page_bg_type, page_bg_color, page_bg_image, page_bg_video,
  } = req.body;

  if (!name || !slug) {
    return ApiResponse.error(res, 'Campaign name and slug are required.', 400);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO campaigns
        (name, slug, tagline, description, theme_color, banner_image_url,
         mobile_banner_image_url, page_bg_type, page_bg_color, page_bg_image, page_bg_video,
         meta_title, meta_description, starts_at, ends_at, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, slug, tagline || null, description || null,
        theme_color || '#2D6A4F', banner_image_url || null, mobile_banner_image_url || null,
        page_bg_type || 'transparent', page_bg_color || null, page_bg_image || null, page_bg_video || null,
        meta_title || null, meta_description || null,
        starts_at || null, ends_at || null, is_active ? 1 : 0, sort_order || 0,
      ]
    );

    const campaignId = result.insertId;

    if (Array.isArray(sections) && sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        await insertSection(connection, campaignId, sections[i], i);
      }
    } else {
      // Legacy flat product list (pre-section builder clients)
      for (let i = 0; i < product_ids.length; i++) {
        await connection.query(
          'INSERT INTO campaign_products (campaign_id, product_id, sort_order) VALUES (?, ?, ?)',
          [campaignId, product_ids[i], i]
        );
      }
    }

    await connection.commit();
    return ApiResponse.created(res, { id: campaignId }, 'Campaign created.');
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const updateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const [rows] = await pool.query('SELECT id FROM campaigns WHERE id = ?', [id]);
  if (rows.length === 0) {
    return ApiResponse.error(res, 'Campaign not found.', 404);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const fields = [];
    const values = [];
    const columnMap = {
      name: 'name', slug: 'slug', tagline: 'tagline', description: 'description',
      theme_color: 'theme_color', banner_image_url: 'banner_image_url',
      mobile_banner_image_url: 'mobile_banner_image_url',
      page_bg_type: 'page_bg_type', page_bg_color: 'page_bg_color',
      page_bg_image: 'page_bg_image', page_bg_video: 'page_bg_video',
      meta_title: 'meta_title', meta_description: 'meta_description',
      starts_at: 'starts_at', ends_at: 'ends_at', is_active: 'is_active', sort_order: 'sort_order',
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || key === 'id' || !(key in columnMap)) continue;
      fields.push(`${columnMap[key]} = ?`);
      values.push(value === '' ? null : value);
    }

    if (fields.length > 0) {
      values.push(id);
      await connection.query(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    // Sections = full re-sync (delete + re-insert keeps ordering simple)
    if (Array.isArray(updates.sections)) {
      await connection.query('DELETE FROM campaign_sections WHERE campaign_id = ?', [id]);
      await connection.query('DELETE FROM campaign_products WHERE campaign_id = ?', [id]);
      for (let i = 0; i < updates.sections.length; i++) {
        await insertSection(connection, id, updates.sections[i], i);
      }
    } else if (Array.isArray(updates.product_ids)) {
      // Legacy flat product list (pre-section builder clients)
      await connection.query('DELETE FROM campaign_products WHERE campaign_id = ?', [id]);
      for (let i = 0; i < updates.product_ids.length; i++) {
        await connection.query(
          'INSERT INTO campaign_products (campaign_id, product_id, sort_order) VALUES (?, ?, ?)',
          [id, updates.product_ids[i], i]
        );
      }
    }

    await connection.commit();
    return ApiResponse.success(res, { id: Number(id) }, 'Campaign updated.');
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM campaigns WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Campaign deleted.');
});

module.exports = {
  getActiveCampaigns,
  getCampaignBySlug,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
};
