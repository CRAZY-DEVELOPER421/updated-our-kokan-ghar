const slugify = require('slugify');

const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true
  });
};

const generateUniqueSlug = async (text, tableName, pool) => {
  let slug = generateSlug(text);
  let suffix = 0;
  let exists = true;

  while (exists) {
    const currentSlug = suffix > 0 ? `${slug}-${suffix}` : slug;
    const [rows] = await pool.query(
      `SELECT id FROM ${tableName} WHERE slug = ?`,
      [currentSlug]
    );
    if (rows.length === 0) {
      slug = currentSlug;
      exists = false;
    } else {
      suffix++;
    }
  }

  return slug;
};

module.exports = { generateSlug, generateUniqueSlug };
