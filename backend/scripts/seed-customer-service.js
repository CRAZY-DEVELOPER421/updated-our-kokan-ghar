require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar'
  });

  // Ensure table exists
  await c.query(`
    CREATE TABLE IF NOT EXISTS customer_service_pages (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      service_key VARCHAR(100) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      page_type ENUM('text','faq') NOT NULL DEFAULT 'text',
      content JSON NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_csp_active (is_active, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const pages = [
    {
      service_key: 'terms',
      title: 'Terms of Service',
      page_type: 'text',
      sort_order: 1,
      content: JSON.stringify({
        sections: [
          { heading: '1. Acceptance of Terms', body: 'By accessing or using Konkan Bazaar, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.' },
          { heading: '2. Account Registration', body: 'You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.' },
          { heading: '3. Orders & Payments', body: 'All orders are subject to availability and confirmation. We reserve the right to cancel any order due to pricing errors, stock unavailability, or suspected fraud. Payment will be refunded in such cases.' },
          { heading: '4. Pricing & Availability', body: 'Prices are subject to change without notice. We strive to display accurate pricing but errors may occur. In case of a pricing error, we will contact you before processing the order.' },
          { heading: '5. Shipping & Delivery', body: 'Delivery times are estimates and not guaranteed. We are not liable for delays caused by courier partners, weather, or unforeseen circumstances. Risk of loss passes to you upon delivery.' },
          { heading: '6. Returns & Refunds', body: 'Our return policy is outlined on our Return Policy page. Please review it before making a purchase.' },
          { heading: '7. User Conduct', body: 'You agree not to misuse the platform, engage in fraudulent activities, or violate any applicable laws. We reserve the right to suspend or terminate accounts for violations.' },
          { heading: '8. Intellectual Property', body: 'All content on Konkan Bazaar — including text, images, logos, and trademarks — is our property or used with permission. You may not reproduce, distribute, or create derivative works without our consent.' },
          { heading: '9. Limitation of Liability', body: 'Konkan Bazaar shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount paid for the products in question.' },
          { heading: '10. Changes to Terms', body: 'We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.' },
          { heading: 'Contact', body: 'For questions about these terms, please contact us.' },
        ]
      }),
    },
    {
      service_key: 'return-policy',
      title: 'Return & Refund Policy',
      page_type: 'text',
      sort_order: 2,
      content: JSON.stringify({
        sections: [
          { heading: '7-Day Easy Returns', body: 'We offer a 7-day easy return policy on all non-perishable items from the date of delivery. Items must be unused and in original packaging.' },
          { heading: 'Perishable Items', body: 'For fresh produce, seafood, and other perishable items, please inspect your order upon delivery. If items are damaged or spoiled, contact us within 24 hours with photos for a replacement or refund.' },
          { heading: 'How to Return', body: '', list: [
            'Log in to your account and go to My Orders',
            'Select the order and click "Request Return"',
            'Choose the reason for return and submit',
            'Our team will review and approve within 48 hours',
            'Schedule a pickup or self-ship the item back',
          ] },
          { heading: 'Refund Processing', body: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. Refunds are issued to the original payment method. COD orders are refunded via bank transfer.' },
          { heading: 'Non-Returnable Items', body: '', list: [
            'Items marked as "Final Sale" or "Non-Returnable"',
            'Products damaged due to improper use',
            'Items returned without original packaging',
            'Gift cards',
          ] },
          { heading: 'Cancellations', body: 'Orders can be cancelled within 2 hours of placement. Once an order is processed for shipping, it cannot be cancelled. For cancellations, please contact support.' },
        ]
      }),
    },
    {
      service_key: 'shipping-policy',
      title: 'Shipping Policy',
      page_type: 'text',
      sort_order: 3,
      content: JSON.stringify({
        sections: [
          { heading: 'Delivery Coverage', body: 'We deliver to all major cities and towns across India. Enter your pincode on any product page to check delivery availability for your location.' },
          { heading: 'Shipping Charges', body: 'Free shipping on all orders above ₹499. A flat ₹49 shipping charge applies to orders below ₹499.' },
          { heading: 'Delivery Timeline', body: 'Most orders are delivered within 3-5 business days. Remote and rural areas may take 5-7 business days. During festive seasons, slight delays may occur.' },
          { heading: 'Order Tracking', body: 'Once your order is dispatched, you will receive a tracking link via email and SMS. You can also track orders from your account dashboard.' },
          { heading: 'Packaging', body: 'Fresh produce is packed in ventilated boxes with cushioning. Seafood is flash-frozen and packed in insulated thermocol boxes with gel packs. Non-perishable items are securely packed in corrugated boxes.' },
          { heading: 'Shipping Partners', body: 'We partner with leading courier services including Delhivery, India Post, and professional cold-chain logistics providers for temperature-sensitive items.' },
        ]
      }),
    },
    {
      service_key: 'faq',
      title: 'Frequently Asked Questions',
      page_type: 'faq',
      sort_order: 4,
      content: JSON.stringify({
        categories: [
          {
            category: 'Orders & Delivery',
            questions: [
              { q: 'How do I place an order?', a: 'Simply browse our products, add items to your cart, and proceed to checkout. You can place an order as a guest or create an account for faster checkout.' },
              { q: 'What are your delivery charges?', a: 'We offer FREE delivery on all orders above ₹499. For orders below ₹499, a flat ₹49 delivery charge applies.' },
              { q: 'How long does delivery take?', a: 'Most orders are delivered within 3-5 business days. Remote areas in the Konkan region may take 5-7 business days.' },
              { q: 'Do you deliver to my city?', a: 'We currently deliver across all major cities in India. Enter your pincode on the product page to check delivery availability.' },
              { q: 'Can I change my delivery address after placing an order?', a: 'Yes, you can change your address within 2 hours of placing the order by contacting our support team.' },
            ],
          },
          {
            category: 'Products & Quality',
            questions: [
              { q: 'Are your products organic?', a: 'Many of our products are organically grown, and we clearly label them. We source directly from trusted farmers who follow traditional, sustainable farming practices.' },
              { q: 'How fresh are your products?', a: 'Our products are sourced directly from farms and producers, ensuring maximum freshness. We ship within 24-48 hours of harvesting for perishable items.' },
              { q: 'Do you offer bulk orders?', a: 'Yes! We offer special pricing for bulk orders and corporate gift hampers. Contact us for a custom quote.' },
            ],
          },
          {
            category: 'Returns & Refunds',
            questions: [
              { q: 'What is your return policy?', a: 'We offer a 7-day easy return policy on all non-perishable items. Perishable items can be returned within 24 hours of delivery if damaged.' },
              { q: 'How do I request a return?', a: 'Go to your account dashboard, find the order, and click "Request Return". Our team will review and process your request within 48 hours.' },
              { q: 'When will I get my refund?', a: 'Refunds are processed within 5-7 business days after the returned item is received and inspected.' },
            ],
          },
          {
            category: 'Account & Payments',
            questions: [
              { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, UPI (GPay, PhonePe, Paytm), Net Banking, and Cash on Delivery.' },
              { q: 'Is it safe to pay online?', a: 'Absolutely. All payments are processed securely through Razorpay, a PCI-DSS compliant payment gateway.' },
              { q: 'How does the loyalty program work?', a: 'Earn 1 point for every ₹10 spent. Accumulate points and redeem them for discounts. Higher tiers (Silver, Gold, Platinum) unlock exclusive benefits.' },
            ],
          },
        ]
      }),
    },
    {
      service_key: 'privacy',
      title: 'Privacy Policy',
      page_type: 'text',
      sort_order: 5,
      content: JSON.stringify({
        sections: [
          { heading: 'Information We Collect', body: '', list: [
            'Name, email address, phone number, and shipping address',
            'Payment information (processed securely by Razorpay — we never store card details)',
            'Order history and browsing behaviour',
            'Device information and IP address',
          ] },
          { heading: 'How We Use Your Information', body: '', list: [
            'To process and deliver your orders',
            'To send order updates and shipping notifications',
            'To personalise your shopping experience',
            'To improve our products and services',
            'To send promotional offers (with your consent)',
          ] },
          { heading: 'Data Protection', body: 'We implement industry-standard security measures including SSL encryption, secure data storage, and regular security audits. Your data is stored on secure servers and accessed only by authorised personnel.' },
          { heading: 'Third-Party Services', body: 'We use trusted third-party services for payment processing (Razorpay), email delivery, and analytics. These services have their own privacy policies governing data handling.' },
          { heading: 'Cookies', body: 'We use cookies to improve your experience, remember your preferences, and analyse site traffic. You can control cookie settings through your browser preferences.' },
          { heading: 'Your Rights', body: 'You have the right to access, correct, or delete your personal data. You can manage your account settings or contact us to exercise these rights.' },
          { heading: 'Contact', body: 'For privacy-related inquiries, please contact us.' },
        ]
      }),
    },
  ];

  let inserted = 0;
  for (const p of pages) {
    await c.query(
      `INSERT INTO customer_service_pages (service_key, title, page_type, content, is_active, sort_order)
       VALUES (?, ?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         page_type = VALUES(page_type),
         content = VALUES(content),
         sort_order = VALUES(sort_order)`,
      [p.service_key, p.title, p.page_type, p.content, p.sort_order]
    );
    inserted++;
    console.log(`  ✓ ${p.service_key} — ${p.title}`);
  }
  console.log(`Inserted/updated ${inserted} customer service pages`);

  await c.end();
  console.log('Done.');
})().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
