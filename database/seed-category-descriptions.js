/**
 * Seed descriptions & image_urls for all categories.
 *
 * Usage: cd backend && node ../database/seed-category-descriptions.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

// ── Descriptions ──────────────────────────────────────────
const DESCRIPTIONS = {
  'Fresh Fruits': 'Farm-fresh seasonal and exotic fruits sourced directly from Konkan region orchards. Bursting with natural sweetness and flavor.',
  'Mangoes': 'Premium Konkan mangoes including the King Alphonso, Payri, Mankurad, Kesar, and more — handpicked at peak ripeness.',
  'Alphonso': 'The king of mangoes — known for its rich aroma, golden-yellow flesh, and sweet buttery taste. Grown in the Ratnagiri & Devgad regions.',
  'Payri': 'An early-season mango variety with a distinct sweet-tart flavor. Loved for its juicy texture and unique aroma.',
  'Mankurad': 'A prized Goan mango variety known for its intense sweetness, rich orange pulp, and fiberless texture.',
  'Kesar': 'The saffron-colored mango from Gujarat, renowned for its sweet, non-fibrous flesh and delightful fragrance.',
  'Totapuri': 'A unique mango variety with a parrot-beak shape, firm flesh perfect for slicing, and a balanced sweet-tangy flavor.',
  'Rajapuri': 'A large-sized mango variety known for its mild sweetness and firm texture, ideal for pickles and raw preparations.',
  'Raw Mango': 'Unripe green mangoes perfect for pickles, chutneys, and traditional Konkan cuisine. Tangy and refreshing.',
  'Jackfruit': 'The king of tropical fruits — versatile, sweet, and aromatic. Enjoyed ripe as fruit or young as a meat substitute in curries.',
  'Cashew Apple': 'The juicy, tropical fruit attached to the cashew nut. Sweet, slightly astringent, and used to make feni and juice.',
  'Banana': 'Naturally ripened bananas from Konkan farms. Rich in potassium, fiber, and natural energy.',
  'Jamun': 'The purple-black summer fruit known for its unique sweet-tart flavor and deep purple-staining juice. Rich in antioxidants.',
  'Karvanda': 'A small, tangy wild berry popular in Konkan cuisine. Used in pickles, chutneys, and refreshing beverages.',
  'Kokum': 'A deep purple fruit native to the Western Ghats. Prized for its cooling properties and used in sol kadhi, juices, and curries.',
  'Pineapple': 'Sweet and juicy pineapples grown in the tropical climate of Konkan. Perfect for fresh eating and desserts.',
  'Papaya': 'Sun-ripened papayas with rich orange flesh. Naturally sweet and packed with vitamins and digestive enzymes.',
  'Watermelon': 'Crisp, refreshing watermelons perfect for beating the Konkan heat. Sweet and hydrating.',
  'Sitaphal': 'Also known as custard apple or sugar apple — a creamy, naturally sweet tropical fruit with a delightful fragrance.',
  'Tender Coconut': 'Fresh tender coconuts with sweet, nutrient-rich water and soft, jelly-like flesh. A natural isotonic drink.',

  'Fresh Vegetables': 'A vibrant selection of fresh, locally-grown vegetables from Konkan farms. Picked at peak freshness for authentic home-cooked meals.',
  'Tendli': 'Also known as ivy gourd or kundru — a small, green vegetable popular in Konkan and Goan cuisine. Used in stir-fries and curries.',
  'Ratale (Sweet Potato)': 'Sweet, nutritious tubers with orange or purple flesh. Roasted, boiled, or used in traditional Konkan sweets.',
  'Suran (Elephant Foot Yam)': 'A giant yam with a unique texture, popular in Konkan curries and fries. Rich in fiber and nutrients.',
  'Colocasia': 'Also known as arbi or taro root — a starchy root vegetable used in Konkan curries, stir-fries, and patrode (spiced rolls).',
  'Drumstick': 'Long, slender pods of the Moringa tree. Nutritious and used in sambar, curries, and stir-fries.',
  'Brinjal': 'Also known as eggplant or baingan — a versatile vegetable used in Konkan bhareet, bharli vangi, and curries.',
  'Pumpkin': 'Sweet, golden-orange pumpkin used in Konkan curries, soupy preparations, and traditional sweets.',
  'Raw Banana': 'Unripe green bananas used in Konkan curries, fries, and cutlets. A great source of resistant starch.',
  'Green Chilli': 'Fresh, spicy green chilies from Konkan farms. Adds heat and flavor to every Konkan dish.',
  'Okra': 'Also known as bhindi or ladyfinger — a tender green vegetable used in stir-fries and curries across Konkan cuisine.',
  'Cluster Beans': 'Also known as gavar or guar beans — flat, tender green beans popular in Konkan vegetable preparations.',
  'Ash Gourd': 'A large, pale green vegetable with mild flavor. Used in Konkan curries, sweets, and Ayurvedic preparations.',
  'Bottle Gourd': 'Also known as lauki or dudhi — a light, easily digestible vegetable used in Konkan curries and kofta.',

  'Dry Fruits & Nuts': 'Premium quality dry fruits and nuts — cashews, almonds, walnuts, raisins, and figs sourced from the finest growers.',
  'Cashew': 'Premium Konkan cashews — known for their natural sweetness and creamy texture. Grown abundantly in the coastal region.',
  'Roasted Cashew': 'Lightly roasted cashews that bring out their natural nutty flavor. A perfect healthy snack.',
  'Salted Cashew': 'Crisp, roasted cashews with a touch of salt. An irresistible crunchy snack.',
  'Masala Cashew': 'Spiced and roasted cashews seasoned with traditional Konkan masalas. A flavorful tea-time snack.',
  'Honey Cashew': 'Cashews coated with a light glaze of natural honey. Sweet, crunchy, and utterly delicious.',
  'Cashew Pieces': 'Broken cashew pieces — perfect for cooking, baking, and making sweets. Same premium quality at a better value.',
  'Cashew Flour': 'Finely ground cashew flour — a gluten-free alternative for baking and thickening curries.',
  'Cashew Butter': 'Creamy, all-natural cashew butter made from premium Konkan cashews. No added oils or preservatives.',
  'Cashew Milk': 'Smooth and creamy plant-based cashew milk. A delicious dairy-free alternative.',
  'Almonds': 'Premium California almonds — crunchy, nutritious, and perfect for snacking or cooking.',
  'Walnuts': 'Whole walnuts with a rich, earthy flavor. Packed with omega-3 fatty acids and antioxidants.',
  'Raisins': 'Sun-dried golden and black raisins. Naturally sweet and perfect for desserts and cooking.',
  'Figs': 'Premium dried figs — chewy, sweet, and rich in fiber and natural energy.',

  'Coconut Products': 'Versatile coconut-based products from whole coconuts to oils, milks, vinegars, and traditional sweets.',
  'Coconut Oil': 'Pure, cold-pressed coconut oil extracted from fresh Konkan coconuts. Ideal for cooking, hair, and skin care.',
  'Virgin Coconut Oil': 'First-press, unrefined virgin coconut oil. Retains the natural aroma and maximum nutrients.',
  'Fresh Coconut': 'Whole fresh coconuts with sweet water and tender meat. Perfect for cooking, snacking, and hydration.',
  'Dry Coconut': 'Desiccated or whole dried coconut. Used extensively in Konkan curries, chutneys, and sweets.',
  'Coconut Powder': 'Finely ground dried coconut powder. Perfect for thickening curries and making chutneys.',
  'Coconut Cream': 'Rich, creamy coconut cream extracted from fresh coconuts. Ideal for curries and desserts.',
  'Coconut Milk': 'Smooth, dairy-free coconut milk. A staple in Konkan cuisine for curries and sweet preparations.',
  'Coconut Sugar': 'Natural, low-glycemic sweetener made from coconut palm sap. A healthy alternative to refined sugar.',
  'Coconut Vinegar': 'Fermented coconut vinegar with a mild, fruity flavor. Perfect for salads and Konkan cooking.',
  'Coconut Chips': 'Thinly sliced and baked coconut chips. A crunchy, healthy snack available in various flavors.',
  'Coconut Laddu': 'Traditional Konkan sweet made from fresh coconut and jaggery. Soft, sweet, and utterly delicious.',
  'Coconut Barfi': 'Rich, fudge-like coconut barfi made with fresh coconut, sugar, and cardamom. A festive favorite.',

  'Kokum Products': 'Authentic Kokum-based products — from fresh and dried kokum to syrups, sharbats, and the famous Sol Kadhi.',
  'Fresh Kokum': 'Freshly harvested kokum fruit from the Western Ghats. Deep purple and rich in antioxidants.',
  'Dried Kokum': 'Sun-dried kokum rinds. A pantry essential for Konkan cuisine — used in curries, beverages, and medicines.',
  'Kokum Syrup': 'Concentrated kokum syrup made from real kokum extract. Refreshing and naturally cooling.',
  'Kokum Sharbat': 'Traditional Konkan kokum sharbat — a sweet-sour concentrate mixed with water for a refreshing drink.',
  'Kokum Agal': 'Kokum agal — a traditional thick kokum extract used in Ayurvedic preparations and cooking.',
  'Sol Kadhi Mix': 'Instant sol kadhi mix — just add coconut milk for the iconic Konkan digestive drink in minutes.',
  'Sol Kadhi Concentrate': 'Ready-to-use sol kadhi concentrate. Mix with chilled buttermilk or water for an instant refreshing drink.',

  'Mango Products': 'Delicious mango-based products — from Aamras and pulp to jams, squashes, bars, and candies. Mango goodness all year round!',
  'Aamras': 'Pure, rich mango pulp — the essence of Alphonso mangoes. Perfect for aamras puri and desserts.',
  'Mango Pulp': 'Sweet, smooth mango pulp made from premium Konkan mangoes. Ideal for shakes, desserts, and cooking.',
  'Mango Jam': 'Homestyle mango jam made with real fruit and natural sweetness. Perfect for toast and parathas.',
  'Mango Squash': 'Concentrated mango squash — mix with water for a refreshing summer drink.',
  'Mango Bar': 'Chewy, fruity mango bars made from real mango pulp. A healthy, natural snack.',
  'Aam Papad': 'Traditional sun-dried mango leather. Sweet, chewy, and tangy — a beloved Konkan treat.',
  'Dried Mango': 'Sun-dried mango slices. A tangy, chewy snack that captures the essence of fresh mangoes.',
  'Raw Mango Powder': 'Also known as amchur — dried and ground raw mango powder. A tangy seasoning for Indian cuisine.',
  'Mango Candy': 'Sweet and tangy mango candies made from real mango pulp. A delightful treat for all ages.',

  'Rice & Grains': 'Traditional Konkan rice varieties and grains — from aromatic Indrayani to nutritious red rice and hand-pounded goodness.',
  'Indrayani Rice': 'Aromatic, fine-grained rice from the Konkan region. Known for its fragrance and fluffy texture.',
  'Ambemohar Rice': 'A fragrant, small-grained rice variety from Maharashtra. Known for its distinctive mango-blossom aroma.',
  'Red Rice': 'Nutritious unpolished red rice with a nutty flavor. Rich in anthocyanins, fiber, and minerals.',
  'Brown Rice': 'Healthier unpolished brown rice with the bran layer intact. High in fiber and nutrients.',
  'Kolam Rice': 'A short-grain, aromatic rice from Maharashtra. Soft, fluffy, and perfect for everyday meals.',
  'Ukda Rice': 'Also known as ukda tandul — a parboiled, sun-dried rice variety from Konkan. Essential for traditional dishes.',
  'Hand Pounded Rice': 'Traditionally hand-pounded rice that retains maximum nutrition and natural flavor. Supports traditional milling.',
  'Govind Bhog': 'A fragrant, small-grained premium rice variety from West Bengal. Known for its exquisite aroma and taste.',
  'Rice Flour': 'Finely ground rice flour made from premium Konkan rice. Perfect for making bhakri, dosa, and traditional sweets.',
  'Poha': 'Flattened rice — a Konkan breakfast staple. Light, quick to cook, and delicious when seasoned with turmeric and peanuts.',
  'Brown Poha': 'Healthier brown poha made from unpolished rice. Retains more fiber and nutrients than white poha.',
  'Gavthi Brown Poha': 'Traditional village-style brown poha from indigenous rice varieties. Authentic, rustic, and full of flavor.',
  'Murmura': 'Crispy puffed rice. A light snack, base for bhel puri, and essential ingredient in many Indian snacks.',

  'Flours': 'Traditional Konkan flours — from nutrient-rich nachni to hearty jowar, bajra, and specialty bhakri flours.',
  'Nachni Flour': 'Also known as ragi or finger millet flour. Highly nutritious, gluten-free, and rich in calcium.',
  'Jowar Flour': 'Sorghum flour — a gluten-free, high-fiber flour perfect for bhakri and traditional flatbreads.',
  'Bajra Flour': 'Pearl millet flour — nutritious and hearty. Used for bhakri and traditional winter flatbreads.',
  'Bhakri Flour': 'Special blend of flours for making authentic Konkan bhakri. Perfectly balanced for the right texture.',
  'Kombdi Vade Flour': 'Specialty flour blend for making Kombdi Vade — a traditional Konkan chicken and vade dish.',
  'Multigrain Flour': 'Nutritious blend of multiple grains and millets. Perfect for healthy rotis and flatbreads.',

  'Masalas & Spices': 'Authentic Konkan masalas and whole spices — from Malvani and Goda masalas to single-origin black pepper and Byadgi chilies.',
  'Malvani Masala': 'The iconic spice blend of the Malvan coast. Aromatic, medium-spicy, and essential for authentic Konkan seafood curries.',
  'Fish Curry Masala': 'Specialty masala blend for traditional Konkan fish curry. Perfect balance of coconut, spices, and kokum.',
  'Chicken Masala': 'Aromatic spice blend for Konkan-style chicken preparations. Rich, flavorful, and mildly spicy.',
  'Goda Masala': 'A distinctive Maharashtrian spice blend with a unique sweet-savory profile. Essential for traditional Konkan cuisine.',
  'Garam Masala': 'Premium blend of warming spices — cardamom, cinnamon, cloves, and more. Adds depth to any dish.',
  'Turmeric': 'Pure, sun-dried turmeric from Konkan farms. Known for its high curcumin content and vibrant color.',
  'Black Pepper': 'Premium black pepper from the Western Ghats — known as black gold. Pungent, aromatic, and freshly ground.',
  'Byadgi Chilli': 'Famous Byadgi red chilies from Karnataka. Known for their deep red color and mild heat — perfect for masalas.',
  'Red Chilli Powder': 'Pure, ground red chilli powder from premium Byadgi chilies. Vibrant color and balanced heat.',
  'Jeera': 'Premium cumin seeds with a warm, earthy aroma. An essential spice in Konkan and Indian cuisine.',
  'Coriander': 'Whole and ground coriander seeds. Fresh, citrusy aroma that forms the base of many Konkan dishes.',
  'Cardamom': 'Aromatic green cardamom pods. The queen of spices — used in sweets, chai, and savory dishes.',
  'Cloves': 'Premium whole cloves with intense aroma and warmth. Used in masalas, rice dishes, and chai.',
  'Dalchini': 'True cinnamon sticks from premium sources. Sweet, warm, and essential for both sweet and savory cooking.',
  'Tirphal (Teppal)': 'Also known as Sichuan pepper or triphal — a unique Konkan spice with a tingling, citrusy numbing sensation.',
  'Nutmeg': 'Whole nutmeg with a warm, sweet, and slightly spicy flavor. Freshly grated for the best aroma.',
  'Mace': 'The delicate, web-like covering of nutmeg. Aromatic and used in rich curries and biryanis.',
  'Star Anise': 'Star-shaped spice with a distinct licorice-like flavor. Essential for biryanis and rich gravies.',

  'Pickles': 'Traditional Konkan pickles made the authentic way — sun-dried, spiced, and preserved in premium oils and spices.',
  'Mango Pickle': 'Classic mango pickle made with raw green mangoes, mustard oil, and traditional spices. A Konkan kitchen staple.',
  'Lime Pickle': 'Tangy, spicy lime pickle cured in salt and spices. A burst of flavor with every meal.',
  'Garlic Pickle': 'Pungent, spicy garlic pickle made with fresh garlic cloves. A powerhouse of flavor.',
  'Green Chilli Pickle': 'Fiery green chilli pickle with mustard and spices. For those who love heat with their meal.',
  'Prawn Pickle': 'A Konkan specialty — tender prawns pickled in traditional spices and oil. Unique and delicious.',
  'Fish Pickle': 'Traditional Konkan fish pickle made with dried or fresh fish, spices, and vinegar. A coastal delicacy.',
  'Karvanda Pickle': 'Tangy karvanda (wild berry) pickle — a Konkan specialty with a unique sour-spicy profile.',
  'Jackfruit Pickle': 'Young, tender jackfruit preserved in traditional spices. A unique and flavorful pickle.',
  'Mixed Vegetable Pickle': 'Garden vegetables pickled in traditional spices. A colorful, crunchy medley of flavors.',
  'Tendli Pickle': 'Tendli (ivy gourd) pickle — a Konkan delicacy with a perfect balance of tangy and spicy.',

  'Chutneys': 'Traditional Konkan chutneys — from coconut and garlic to dry fish and kokum. Bursting with regional flavors.',
  'Dry Coconut Chutney': 'Classic Konkan dry coconut chutney made with fresh coconut, spices, and coconut oil. A perfect side.',
  'Peanut Chutney': 'Roasted peanut chutney with garlic and red chilies. Crunchy, spicy, and utterly delicious.',
  'Garlic Chutney': 'Fiery garlic chutney made with fresh garlic, red chilies, and coconut. A Konkan pantry essential.',
  'Sesame Chutney': 'Nutty, aromatic sesame chutney. Made with roasted sesame seeds, coconut, and spices.',
  'Dry Fish Chutney': 'A unique Konkan specialty — dried fish ground with coconut and spices. Bold, umami-packed flavor.',
  'Kokum Chutney': 'Tangy, refreshing kokum chutney. A perfect accompaniment to Konkan meals.',
  'Tamarind Chutney': 'Sweet and tangy tamarind chutney made with tamarind pulp, jaggery, and spices. Essential for chaats.',

  'Seafood': 'Premium dried seafood from the Konkan coast — traditional sun-dried fish, prawns, and more. Authentic coastal flavors.',
  'Dry Fish': 'Traditional sun-dried fish from the Konkan coast. Preserves the authentic flavor of the sea.',
  'Dry Bombil': 'Dried Bombay Duck (Bombil) — a Konkan delicacy. Crispy when fried, with a unique, intense flavor.',
  'Dry Jawla': 'Dried small shrimp (jawla) — a flavorful Konkan ingredient for chutneys and curries.',
  'Dry Kolambi': 'Dried prawns (kolambi) — concentrated seafood flavor. Used in Konkan curries and chutneys.',
  'Dry Mandeli': 'Dried mandeli (anchovy-like fish) — a staple in Konkan coastal cuisine.',

  'Snacks': 'Crispy, crunchy Konkan snacks — from chakli and murukku to banana chips, papads, and traditional mithai.',
  'Chakli': 'Crispy, spiral-shaped savory snack made from rice flour and spices. A beloved Konkan tea-time treat.',
  'Murukku': 'Crunchy, spiral-shaped savory snack made from rice and lentil flour. A South Indian and Konkan favorite.',
  'Chivda': 'Spiced flattened rice mix with peanuts, coconut, and curry leaves. A light, crunchy tea-time snack.',
  'Banana Chips': 'Thinly sliced, crispy banana chips made from raw bananas. Lightly salted for the perfect crunch.',
  'Jackfruit Chips': 'Crispy jackfruit chips made from tender raw jackfruit. A unique, delicious Konkan snack.',
  'Rice Papad': 'Traditional sun-dried rice papads. Roast or fry for a crispy accompaniment to any meal.',
  'Sabudana Papad': 'Crispy sabudana (tapioca) papads. A popular Konkan snack, perfect for fasting days.',
  'Kurdai': 'A traditional Konkan snack made from rice — thin, crisp discs that puff up when fried.',
  'Sandge': 'Traditional steamed and sun-dried rice dumplings from Konkan cuisine. Unique and delicious.',
  'Peanut Chikki': 'Crunchy peanut brittle made with jaggery. A traditional energy-packed Konkan sweet snack.',
  'Til Ladoo': 'Sesame seed and jaggery ladoos. A nutritious winter treat packed with warmth and energy.',

  'Sweets': 'Traditional Konkan sweets and mithai — from Kaju Katli and Coconut Barfi to Ukadiche Modak and Mango Burfi.',
  'Kaju Katli': 'Rich, melt-in-the-mouth cashew fudge. Made from premium Konkan cashews for the perfect texture.',
  'Coconut Barfi': 'Creamy coconut barfi made with fresh coconut and sugar. A classic Konkan sweet.',
  'Khobra Pak': 'A rich Goan-Konkan sweet made from coconut, sugar, and ghee. Dense, sweet, and utterly delicious.',
  'Ukadiche Modak Mix': 'Ready-to-use mix for making Ukadiche Modak — Lord Ganesha\'s favorite steamed dumplings.',
  'Modak': 'Traditional steamed or fried modaks filled with sweet coconut and jaggery filling. A festive favorite.',
  'Phanas Poli': 'Sweet jackfruit puran poli — a traditional Konkan flatbread stuffed with spiced jackfruit filling.',
  'Aam Papad': 'Sun-dried mango leather — a chewy, sweet-tangy treat made from real mango pulp.',
  'Mango Burfi': 'Rich, creamy mango fudge made with mango pulp, milk, and cardamom. A seasonal delicacy.',

  'Beverages': 'Refreshing Konkan beverages — from kokum juice and sugarcane juice to coconut water and traditional sherbats.',
  'Kokum Juice': 'Refreshing kokum juice made from real kokum extract. Naturally cooling and packed with antioxidants.',
  'Sugarcane Juice': 'Fresh, chilled sugarcane juice. Naturally sweet and instantly rejuvenating.',
  'Fresh Lime Juice': 'Freshly squeezed lime juice. Classic, refreshing, and vitamin C-rich.',
  'Coconut Water': 'Pure tender coconut water — nature\'s isotonic drink. Hydrating and nutrient-rich.',
  'Buttermilk Mix': 'Instant buttermilk mix — just mix with water for a refreshing, probiotic-rich drink.',
  'Cashew Apple Juice': 'Refreshing cashew apple juice — a unique Konkan beverage with a sweet-tart flavor profile.',
  'Mango Juice': 'Rich, thick mango juice made from premium Alphonso mangoes. A taste of Konkan summer.',

  'Natural Sweeteners': 'Pure, unrefined natural sweeteners — traditional jaggery, palm jaggery, wild honey, and more.',
  'Jaggery': 'Traditional unrefined jaggery made from sugarcane juice. Rich, complex sweetness with mineral benefits.',
  'Palm Jaggery': 'Natural palm jaggery made from palm sap. Lower glycemic index and rich in nutrients.',
  'Coconut Jaggery': 'Sweet, caramel-like coconut jaggery made from coconut palm sap. A healthy natural sweetener.',
  'Jaggery Powder': 'Finely ground jaggery powder. Easy to use in cooking, baking, and beverages.',
  'Raw Honey': 'Pure, unprocessed raw honey from Konkan farms. Retains all natural enzymes and beneficial properties.',
  'Wild Honey': 'Rare wild honey harvested from forest hives. Intense flavor with medicinal properties.',

  'Ready To Cook': 'Convenient ready-to-cook mixes for traditional Konkan dishes — from Ghavne and Thalipeeth to Modak and Sol Kadhi.',
  'Ghavne Mix': 'Instant mix for making Ghavne — thin, savory Konkan crepes made from rice and coconut.',
  'Thalipeeth Mix': 'Ready-to-make Thalipeeth — traditional spiced multi-grain flatbread mix. Just add water and cook!',
  'Kombdi Vade Mix': 'Complete mix for Kombdi Vade — the iconic Konkan chicken curry with fluffy vade.',
  'Modak Mix': 'Ready-to-use Modak mix for making Lord Ganesha\'s favorite sweet dumplings.',
  'Sol Kadhi Mix': 'Instant Sol Kadhi mix — just add coconut milk for the famous Konkan digestive appetizer.',

  'Traditional Foods': 'Time-honored Konkan traditional foods — bhakris, sol kadhi, kombdi vade, and more. Authentic recipes preserved for generations.',
  'Rice Bhakri': 'Traditional hand-made rice bhakri (flatbread). A Konkan dietary staple, gluten-free and wholesome.',
  'Nachni Bhakri': 'Nutritious nachni (ragi) bhakri. A traditional finger millet flatbread rich in calcium and fiber.',
  'Bhakri Flour': 'Specially milled flour blend for making authentic Konkan bhakris. Perfect consistency.',
  'Sol Kadhi': 'The iconic Konkan digestive drink made from kokum and coconut milk. Cooling, refreshing, and delicious.',
  'Kombdi Vade': 'Traditional Konkan chicken curry served with fluffy vade (fried bread). A legendary coastal dish.',

  'Eco Friendly Products': 'Sustainable, eco-friendly products from Konkan — areca leaf plates, coconut shell crafts, bamboo baskets, and more.',
  'Areca Leaf Plates': 'Eco-friendly disposable plates made from fallen areca leaves. Biodegradable, compostable, and naturally sturdy.',
  'Banana Fiber Products': 'Sustainable products made from banana plant fiber. Eco-friendly, durable, and handcrafted.',
  'Bamboo Basket': 'Handwoven bamboo baskets made by Konkan artisans. Perfect for storage, gifting, and decor.',
  'Coconut Shell Handicrafts': 'Beautiful handicrafts made from upcycled coconut shells. Unique, sustainable, and artisan-crafted.',
  'Wooden Spice Box': 'Traditional wooden spice boxes (masala dabba) handcrafted by Konkan artisans.',
  'Handloom Towels': 'Soft, absorbent handloom towels woven on traditional Konkan looms. Sustainable and skin-friendly.',
  'Coir Products': 'Eco-friendly coir products made from coconut husk fiber. Durable, biodegradable, and versatile.',

  'Gift Hampers': 'Beautifully curated Konkan gift hampers — perfect for every occasion. Mango boxes, cashew gifts, festival specials, and corporate hampers.',
  'Mango Gift Box': 'A premium selection of the finest Konkan mangoes, beautifully packed. The perfect seasonal gift.',
  'Cashew Gift Box': 'Premium Konkan cashew assortment in an elegant gift box. A thoughtful and delicious present.',
  'Konkan Festival Box': 'A curated collection of traditional Konkan delicacies and treats. Perfect for festive gifting.',
  'Healthy Konkan Box': 'A health-conscious hamper with natural sweeteners, dry fruits, and nutritious Konkan products.',
  'Traditional Konkan Box': 'A complete Konkan experience — masalas, pickles, chutneys, and traditional foods in one beautiful box.',
  'Corporate Gift Hampers': 'Premium corporate gifting solutions featuring the best of Konkan. Customizable for your business needs.',
};

// ── Image URLs (using placeholder images that match the category theme) ──
const IMAGES = {
  'Fresh Fruits': '/uploads/categories/fresh-fruits.jpg',
  'Fresh Vegetables': '/uploads/categories/fresh-vegetables.jpg',
  'Dry Fruits & Nuts': '/uploads/categories/dry-fruits-nuts.jpg',
  'Coconut Products': '/uploads/categories/coconut-products.jpg',
  'Kokum Products': '/uploads/categories/kokum-products.jpg',
  'Mango Products': '/uploads/categories/mango-products.jpg',
  'Rice & Grains': '/uploads/categories/rice-grains.jpg',
  'Flours': '/uploads/categories/flours.jpg',
  'Masalas & Spices': '/uploads/categories/masalas-spices.jpg',
  'Pickles': '/uploads/categories/pickles.jpg',
  'Chutneys': '/uploads/categories/chutneys.jpg',
  'Seafood': '/uploads/categories/seafood.jpg',
  'Snacks': '/uploads/categories/snacks.jpg',
  'Sweets': '/uploads/categories/sweets.jpg',
  'Beverages': '/uploads/categories/beverages.jpg',
  'Natural Sweeteners': '/uploads/categories/natural-sweeteners.jpg',
  'Ready To Cook': '/uploads/categories/ready-to-cook.jpg',
  'Traditional Foods': '/uploads/categories/traditional-foods.jpg',
  'Eco Friendly Products': '/uploads/categories/eco-friendly.jpg',
  'Gift Hampers': '/uploads/categories/gift-hampers.jpg',
};

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar',
    waitForConnections: true,
    connectionLimit: 1,
    charset: 'utf8mb4'
  });

  try {
    const [categories] = await pool.query(
      'SELECT id, name, description, image_url FROM categories ORDER BY name'
    );

    console.log(`📋 Found ${categories.length} categories in DB.\n`);
    let updated = 0;

    for (const cat of categories) {
      const desc = DESCRIPTIONS[cat.name];
      const img = IMAGES[cat.name];
      const updates = [];

      if (desc && (!cat.description || cat.description.trim() === '')) {
        updates.push(`description = ${pool.escape(desc)}`);
      }
      if (img && (!cat.image_url || cat.image_url.trim() === '')) {
        updates.push(`image_url = ${pool.escape(img)}`);
      }

      if (updates.length > 0) {
        await pool.query(
          `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
          [cat.id]
        );
        console.log(`✅ "${cat.name}" — ${updates.join(', ')}`);
        updated++;
      } else {
        console.log(`⏭️  "${cat.name}" — already has data, skipped.`);
      }
    }

    // Also update subcategories with generic descriptions if they don't have one
    console.log(`\n📝 Updating subcategories with descriptions...`);
    for (const cat of categories) {
      if (!DESCRIPTIONS[cat.name]) {
        // Generate a generic but meaningful description
        const desc = `${cat.name} — a premium product from Konkan Bazaar. Sourced directly from local producers for the best quality and authenticity.`;
        if (!cat.description || cat.description.trim() === '') {
          await pool.query(
            'UPDATE categories SET description = ? WHERE id = ?',
            [desc, cat.id]
          );
          console.log(`   ℹ️ "${cat.name}" — generic description added.`);
          updated++;
        }
      }
    }

    console.log(`\n✅ Done! ${updated} categories updated successfully.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
