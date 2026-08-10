/**
 * ============================================================
 * KONKAN BAZAAR — Kokan Catalog Data
 * ============================================================
 * THE single source of truth for the store catalog.
 *
 * Structure:  Category → [ Subcategories ]
 * Each category carries a `profile` (drives realistic demo data
 * generation — prices, units, shelf life, descriptions) and an
 * optional `price` range override.
 *
 * This file is committed to git — run it through
 * `node database/migrate-kokan-catalog.js` to save everything
 * into the database. NOTHING here is hardcoded in the app.
 * ============================================================
 */

module.exports = [
  {
    name: 'KOKAN MEVA / FRESH FRUITS',
    sortOrder: 1,
    description: 'Farm-fresh seasonal fruits from the Konkan belt — Alphonso mangoes, jackfruit, jamun, kokum and more, harvested at peak ripeness and delivered to your doorstep.',
    profile: 'fresh',
    price: [49, 899],
    children: [
      'Alphonso Mango (Hapus)',
      'Ratnagiri Alphonso Mango',
      'Devgad Alphonso Mango',
      'Kesar Mango',
      'Pairi Mango',
      'Totapuri Mango',
      'Raw Mango / Kaccha Aamba',
      'Jackfruit / Fanas',
      'Raw Jackfruit / Kachra Fanas',
      'Jambhul / Jamun',
      'Karvanda',
      'Kokum',
      'Ambada',
      'Chikoo',
      'Amla',
      'Peru / Guava',
      'Bor',
      'Karmal / Kamarakh',
      'Pineapple',
      'Banana',
      'Papaya',
      'Coconut',
      'Tender Coconut'
    ]
  },
  {
    name: 'MANGO / AAMBA PRODUCTS',
    sortOrder: 2,
    description: 'The king of fruits in every form — aamras, pulp, juice, squash, pickles, chunda, amchur and dried mango, all made from premium Konkan mangoes.',
    profile: 'process',
    price: [99, 549],
    children: [
      'Aamras',
      'Alphonso Mango Pulp',
      'Mango Pulp',
      'Mango Juice',
      'Mango Sharbat',
      'Mango Syrup',
      'Mango Squash',
      'Mango Jam',
      'Mango Jelly',
      'Mango Murabba',
      'Mango Chunda',
      'Mango Pickle',
      'Kairi Pickle',
      'Methamba',
      'Mango Lonche',
      'Mango Chutney',
      'Kairichi Chutney',
      'Amchur',
      'Amchur Powder',
      'Raw Mango Powder',
      'Dried Mango',
      'Dried Raw Mango',
      'Mango Candy',
      'Mango Barfi',
      'Mango Ladoo',
      'Mango Masala'
    ]
  },
  {
    name: 'KOKUM / AAMSUL PRODUCTS',
    sortOrder: 3,
    description: 'Cooling kokum (Garcinia indica) in every form — fresh, dried, syrup, sharbat, concentrate, solkadhi mix and more, straight from the Konkan forests.',
    profile: 'process',
    price: [99, 399],
    children: [
      'Fresh Kokum',
      'Dried Kokum',
      'Kokum Aamsul',
      'Kokum Agal',
      'Kokum Concentrate',
      'Kokum Syrup',
      'Kokum Sharbat',
      'Kokum Juice',
      'Kokum Squash',
      'Kokum Candy',
      'Kokum Masala',
      'Kokum Pickle',
      'Kokum Chutney',
      'Kokum Jam',
      'Kokum Solkadhi Mix'
    ]
  },
  {
    name: 'JAMBHUL / JAMUN PRODUCTS',
    sortOrder: 4,
    description: 'Nutritious jamun (java plum) transformed into juices, syrups, jams, candies and preserves by traditional Konkan recipes.',
    profile: 'process',
    price: [99, 399],
    children: [
      'Fresh Jambhul',
      'Dried Jambhul',
      'Jambhul Juice',
      'Jambhul Sharbat',
      'Jambhul Syrup',
      'Jambhul Squash',
      'Jambhul Candy',
      'Jambhul Jam',
      'Jambhul Jelly',
      'Jambhul Preserve'
    ]
  },
  {
    name: 'KARVANDA PRODUCTS',
    sortOrder: 5,
    description: 'Tangy karvanda (karonda) specialities — pickles, chutneys, jams, murabba, candies and refreshing sharbats.',
    profile: 'process',
    price: [89, 349],
    children: [
      'Fresh Karvanda',
      'Dried Karvanda',
      'Karvanda Pickle',
      'Karvanda Chutney',
      'Karvanda Jam',
      'Karvanda Jelly',
      'Karvanda Murabba',
      'Karvanda Candy',
      'Karvanda Syrup',
      'Karvanda Sharbat'
    ]
  },
  {
    name: 'AMBADA PRODUCTS',
    sortOrder: 6,
    description: 'Sour-sweet ambada (hog plum) preserves — pickles, chutneys, jellies, candies and traditional murabba.',
    profile: 'process',
    price: [89, 329],
    children: [
      'Fresh Ambada',
      'Dried Ambada',
      'Ambada Pickle',
      'Ambada Chutney',
      'Ambada Jelly',
      'Ambada Candy',
      'Ambada Murabba',
      'Ambada Syrup'
    ]
  },
  {
    name: 'FANAS / JACKFRUIT PRODUCTS',
    sortOrder: 7,
    description: 'The versatile jackfruit (fanas) — fresh fruit, chips, gar, poli, vadi, pickle and sweet preserves.',
    profile: 'process',
    price: [99, 449],
    children: [
      'Fresh Fanas',
      'Raw Fanas',
      'Fanas Gar',
      'Fanas Gari',
      'Fanas Chips',
      'Fanas Bhaji',
      'Dried Jackfruit',
      'Jackfruit Pickle',
      'Fanas Poli',
      'Fanas Vadi',
      'Jackfruit Candy',
      'Jackfruit Jam',
      'Jackfruit Preserve'
    ]
  },
  {
    name: 'KOKAN CASHEW / KAJU',
    sortOrder: 8,
    description: 'Premium Konkan cashews — raw, roasted, salted, masala, pepper and garlic flavours, plus cashew powder, pieces and sweets.',
    profile: 'dry',
    price: [299, 899],
    children: [
      'Raw Cashew',
      'Kokan Cashew',
      'Roasted Cashew',
      'Salted Cashew',
      'Masala Cashew',
      'Pepper Cashew',
      'Garlic Cashew',
      'Chilli Cashew',
      'Cashew Powder',
      'Cashew Pieces',
      'Cashew Sweets',
      'Cashew Brittle'
    ]
  },
  {
    name: 'COCONUT PRODUCTS',
    sortOrder: 9,
    description: 'Everything coconut — fresh, tender, dry, copra, flakes, jaggery, sugar and traditional sweets from Konkan groves.',
    profile: 'process',
    price: [99, 449],
    children: [
      'Fresh Coconut',
      'Tender Coconut',
      'Dry Coconut',
      'Coconut Copra',
      'Coconut Kernel',
      'Coconut Flakes',
      'Coconut Jaggery',
      'Coconut Sugar',
      'Coconut Ladoo',
      'Coconut Barfi',
      'Coconut Chutney',
      'Coconut Masala'
    ]
  },
  {
    name: 'KOKAN RICE / TANDUL',
    sortOrder: 10,
    description: 'Authentic Konkan rice — ukade, hand-pounded, ambemohar, red and brown rice, plus rice flours, rava and poha.',
    profile: 'dry',
    price: [149, 1099],
    children: [
      'Ukade Rice',
      'Hand Pounded Rice',
      'Red Rice',
      'Brown Rice',
      'Kokan Rice',
      'Ambemohar Rice',
      'Local Gavran Rice',
      'Rice Flour',
      'Ukadiche Modak Rice Flour',
      'Ghavan Rice Flour',
      'Amboli Rice Flour',
      'Rice Rava',
      'Rice Poha'
    ]
  },
  {
    name: 'POHA / CHIVDA PRODUCTS',
    sortOrder: 11,
    description: 'Flattened rice (poha) in thick, thin and roasted varieties, plus crunchy coconut, garlic and masala chivda mixes.',
    profile: 'snack',
    price: [49, 249],
    children: [
      'Thick Poha',
      'Thin Poha',
      'Red Poha',
      'Kokan Poha',
      'Rice Poha',
      'Roasted Poha',
      'Poha Chivda',
      'Coconut Chivda',
      'Garlic Chivda',
      'Masala Chivda',
      'Gavran Chivda'
    ]
  },
  {
    name: 'PEETH / FLOURS',
    sortOrder: 12,
    description: 'Stone-ground traditional flours — nachni, jowar, bajra, bhakri, thalipeeth, ghavan and multigrain blends.',
    profile: 'dry',
    price: [59, 299],
    children: [
      'Rice Flour',
      'Nachni Peeth',
      'Jowar Peeth',
      'Bajra Peeth',
      'Bhakri Peeth',
      'Thalipeeth Peeth',
      'Ghavan Peeth',
      'Amboli Peeth',
      'Vada Peeth',
      'Dosa Peeth',
      'Kulith Peeth',
      'Besan',
      'Multigrain Peeth'
    ]
  },
  {
    name: 'BHAJANI',
    sortOrder: 13,
    description: 'Ready-to-use bhajani blends for thalipeeth, chakli, vada and multigrain preparations.',
    profile: 'dry',
    price: [79, 249],
    children: [
      'Thalipeeth Bhajani',
      'Chakli Bhajani',
      'Bhajani Peeth',
      'Multigrain Bhajani',
      'Gavran Bhajani',
      'Vada Bhajani'
    ]
  },
  {
    name: 'KULITH / HORSE GRAM',
    sortOrder: 14,
    description: 'Protein-rich kulith (horse gram) — whole grain, dal, pithla mix and crispy papad.',
    profile: 'dry',
    price: [99, 299],
    children: [
      'Whole Kulith',
      'Kulith Dal',
      'Kulith Pithla Mix',
      'Kulith Papad'
    ]
  },
  {
    name: 'KOKAN DAL / KADHANYA',
    sortOrder: 15,
    description: 'The pulses and legumes of the Konkan pantry — val, chawali, matki, moong, udid, toor, masoor and mixed kadhanya.',
    profile: 'dry',
    price: [79, 399],
    children: [
      'Val',
      'Gavran Val',
      'Chawali',
      'Matki',
      'Moong',
      'Udid',
      'Toor Dal',
      'Masoor',
      'Kulith',
      'Harbhara',
      'Mixed Kadhanya'
    ]
  },
  {
    name: 'MALVANI MASALA',
    sortOrder: 16,
    description: 'Signature Malvani spice blends — fish, chicken, mutton, veg and seafood masalas with authentic coastal flavour.',
    profile: 'spice',
    price: [99, 349],
    children: [
      'Malvani Masala',
      'Malvani Masala Mild',
      'Malvani Masala Spicy',
      'Malvani Chicken Masala',
      'Malvani Mutton Masala',
      'Malvani Fish Masala',
      'Malvani Seafood Masala',
      'Malvani Veg Masala',
      'Coconut Masala',
      'Kanda Lasun Masala',
      'Kala Masala',
      'Goda Masala',
      'Garam Masala'
    ]
  },
  {
    name: 'WHOLE SPICES / KHADA MASALA',
    sortOrder: 17,
    description: 'Single-origin Konkan spices — black pepper, cloves, cardamom, cinnamon, dagad phool, star anise and more.',
    profile: 'spice',
    price: [99, 599],
    children: [
      'Black Pepper',
      'Cloves',
      'Cinnamon',
      'Cardamom',
      'Bay Leaf',
      'Star Anise',
      'Coriander Seeds',
      'Cumin',
      'Fenugreek',
      'Mustard Seeds',
      'Fennel',
      'Dry Red Chilli',
      'Dagad Phool'
    ]
  },
  {
    name: 'CHUTNEY',
    sortOrder: 18,
    description: 'Traditional Konkan chutneys — dry coconut, garlic, peanut, coriander and fiery green chilli.',
    profile: 'process',
    price: [59, 249],
    children: [
      'Coconut Chutney',
      'Dry Coconut Chutney',
      'Garlic Chutney',
      'Peanut Chutney',
      'Coriander Chutney',
      'Green Chilli Chutney',
      'Dry Fish Chutney'
    ]
  },
  {
    name: 'THECHA',
    sortOrder: 19,
    description: 'Fiery Maharashtrian thecha — green chilli, red chilli, garlic and peanut variants for the bold palate.',
    profile: 'process',
    price: [79, 199],
    children: [
      'Green Chilli Thecha',
      'Red Chilli Thecha',
      'Garlic Thecha',
      'Peanut Thecha',
      'Coconut Thecha',
      'Dry Coconut Thecha'
    ]
  },
  {
    name: 'LONCHE / PICKLES',
    sortOrder: 20,
    description: 'Homestyle Konkan pickles — mango, kairi, lemon, chilli, amla, kokum, karvanda, fish and prawn lonche.',
    profile: 'process',
    price: [89, 349],
    children: [
      'Mango Pickle',
      'Kairi Pickle',
      'Lemon Pickle',
      'Chilli Pickle',
      'Amla Pickle',
      'Kokum Pickle',
      'Karvanda Pickle',
      'Ambada Pickle',
      'Jackfruit Pickle',
      'Garlic Pickle',
      'Mixed Vegetable Pickle',
      'Fish Pickle',
      'Prawn Pickle',
      'Gavran Mixed Pickle'
    ]
  },
  {
    name: 'PAPAD',
    sortOrder: 21,
    description: 'Crispy traditional papads — rice, udid, moong, chana, sabudana, nachni and masala varieties.',
    profile: 'snack',
    price: [49, 199],
    children: [
      'Rice Papad',
      'Udid Papad',
      'Moong Papad',
      'Chana Papad',
      'Sabudana Papad',
      'Nachni Papad',
      'Jowar Papad',
      'Bajra Papad',
      'Potato Papad',
      'Garlic Papad',
      'Chilli Papad',
      'Masala Papad'
    ]
  },
  {
    name: 'SANDGE',
    sortOrder: 22,
    description: 'Traditional Konkan sandge snacks — batata, mirchi, moong, udid, methi and gavran specials.',
    profile: 'snack',
    price: [49, 199],
    children: [
      'Batata Sandge',
      'Mirchi Sandge',
      'Moong Sandge',
      'Udid Sandge',
      'Dal Sandge',
      'Rice Sandge',
      'Sabudana Sandge',
      'Methichi Sandge',
      'Gavran Sandge',
      'Mixed Sandge'
    ]
  },
  {
    name: 'VADI / KURDAI',
    sortOrder: 23,
    description: 'Sun-dried vadis and crunchy kurdai — dal, methi, moong, udid, rice, wheat and sabudana.',
    profile: 'snack',
    price: [49, 249],
    children: [
      'Batata Vadi',
      'Dudhi Vadi',
      'Dal Vadi',
      'Moong Vadi',
      'Udid Vadi',
      'Methi Vadi',
      'Kuradai',
      'Rice Kuradai',
      'Wheat Kuradai',
      'Sabudana Kuradai'
    ]
  },
  {
    name: 'DRIED FRUITS',
    sortOrder: 24,
    description: 'Naturally sun-dried Konkan fruits — mango, jackfruit, jamun, kokum, amla, banana and mixed dried fruits.',
    profile: 'dry',
    price: [99, 449],
    children: [
      'Dried Mango',
      'Dried Jackfruit',
      'Dried Jambhul',
      'Dried Kokum',
      'Dried Karvanda',
      'Dried Ambada',
      'Dried Amla',
      'Dried Banana',
      'Dried Pineapple',
      'Dried Guava',
      'Dried Papaya',
      'Mixed Dried Fruits'
    ]
  },
  {
    name: 'DEHYDRATED VEGETABLES',
    sortOrder: 25,
    description: 'Dehydrated local vegetables — onion, garlic, ginger, chillies, curry leaves, drumstick and mixed veg.',
    profile: 'dry',
    price: [99, 399],
    children: [
      'Dried Onion',
      'Dried Garlic',
      'Dried Ginger',
      'Dried Green Chilli',
      'Dried Red Chilli',
      'Dried Curry Leaves',
      'Dried Coriander',
      'Dried Methi',
      'Dried Drumstick',
      'Dried Bhendi',
      'Dried Brinjal',
      'Dried Tomato',
      'Dried Bitter Gourd',
      'Mixed Dehydrated Vegetables'
    ]
  },
  {
    name: 'KOKAN CHIPS',
    sortOrder: 26,
    description: 'Crisp homemade chips — banana, jackfruit, raw mango, sweet potato, tapioca, coconut and mixed veg.',
    profile: 'snack',
    price: [49, 249],
    children: [
      'Banana Chips',
      'Jackfruit Chips',
      'Raw Banana Chips',
      'Raw Mango Chips',
      'Sweet Potato Chips',
      'Potato Chips',
      'Tapioca Chips',
      'Coconut Chips',
      'Mixed Vegetable Chips'
    ]
  },
  {
    name: 'TRADITIONAL KOKAN SNACKS',
    sortOrder: 27,
    description: 'Village-style snacks — chakli, chivda, bhadang, shankarpali, karanji, ghavan, thalipeeth and shev.',
    profile: 'snack',
    price: [49, 299],
    children: [
      'Chakli',
      'Bhajani Chakli',
      'Chivda',
      'Poha Chivda',
      'Bhadang',
      'Shankarpali',
      'Karanji',
      'Ghavan',
      'Thalipeeth',
      'Bhakri',
      'Shev',
      'Gavran Snacks'
    ]
  },
  {
    name: 'TRADITIONAL KOKAN SWEETS',
    sortOrder: 28,
    description: 'Festive Konkan sweets — aamba poli, fanas poli, coconut vadi, barfis, laddoos and traditional halwa.',
    profile: 'sweet',
    price: [99, 449],
    children: [
      'Aamba Poli',
      'Fanas Poli',
      'Coconut Poli',
      'Aamba Vadi',
      'Fanas Vadi',
      'Coconut Vadi',
      'Mango Barfi',
      'Coconut Barfi',
      'Cashew Barfi',
      'Coconut Ladoo',
      'Besan Ladoo',
      'Ragi Ladoo',
      'Rice Ladoo',
      'Traditional Halwa'
    ]
  },
  {
    name: 'SHARBAT / BEVERAGES',
    sortOrder: 29,
    description: 'Refreshing Konkan drinks — kokum sharbat, aam panna, mango sharbat, solkadhi, coconut water and concentrates.',
    profile: 'beverage',
    price: [99, 349],
    children: [
      'Kokum Sharbat',
      'Aam Panna',
      'Mango Sharbat',
      'Jambhul Sharbat',
      'Karvanda Sharbat',
      'Amla Sharbat',
      'Lemon Sharbat',
      'Coconut Water',
      'Solkadhi',
      'Solkadhi Concentrate',
      'Kokum Concentrate',
      'Mango Concentrate'
    ]
  },
  {
    name: 'NATURAL SWEETENERS',
    sortOrder: 30,
    description: 'Pure gavran jaggery — powder, cubes and liquid, plus jaggery peanut and coconut chikkis.',
    profile: 'sweet',
    price: [99, 399],
    children: [
      'Gavran Jaggery',
      'Jaggery Powder',
      'Liquid Jaggery',
      'Jaggery Cubes',
      'Jaggery Peanut Chikki',
      'Jaggery Coconut Chikki'
    ]
  },
  {
    name: 'FARM FRESH VEGETABLES',
    sortOrder: 31,
    description: 'Farm-fresh gavran vegetables — tomatoes, onion, potato, brinjal, okra, chillies, gourds and seasonal produce.',
    profile: 'fresh',
    price: [29, 199],
    children: [
      'Gavran Tomato',
      'Gavran Onion',
      'Gavran Potato',
      'Brinjal',
      'Okra / Bhendi',
      'Green Chilli',
      'Red Chilli',
      'Bottle Gourd',
      'Ridge Gourd',
      'Bitter Gourd',
      'Pumpkin',
      'Drumstick',
      'Colocasia',
      'Sweet Potato',
      'Suran',
      'Raw Banana',
      'Seasonal Gavran Vegetables'
    ]
  },
  {
    name: 'KOKAN LEAFY / LOCAL VEGETABLES',
    sortOrder: 32,
    description: 'Nutritious local leafy greens — alu leaves, ambadi, shepu, kothimbir, curry leaves and seasonal bhaji.',
    profile: 'fresh',
    price: [19, 149],
    children: [
      'Alu Leaves',
      'Shevgyacha Paala',
      'Ambadi Bhaji',
      'Tandulja',
      'Mayalu',
      'Math',
      'Lal Math',
      'Shepu',
      'Kothimbir',
      'Curry Leaves',
      'Seasonal Gavran Bhaji'
    ]
  },
  {
    name: 'WILD / RANBHAJI PRODUCTS',
    sortOrder: 33,
    description: 'Wild forest produce — ran bhaji, wild greens and mushrooms, bamboo shoots, kadu kand and forest fruits.',
    profile: 'fresh',
    price: [49, 299],
    children: [
      'Ran Bhaji',
      'Wild Greens',
      'Wild Mushrooms',
      'Bamboo Shoots',
      'Kadu Kand',
      'Ran Amla',
      'Ran Bor',
      'Wild Kokum',
      'Seasonal Forest Fruits',
      'Seasonal Forest Vegetables'
    ]
  },
  {
    name: 'READY TO COOK KOKAN FOOD',
    sortOrder: 34,
    description: 'Instant mixes — ghavan, amboli, thalipeeth, bhakri, vada, modak, pithla, zunka, usal and curry mixes.',
    profile: 'dry',
    price: [59, 249],
    children: [
      'Ghavan Mix',
      'Amboli Mix',
      'Thalipeeth Mix',
      'Bhakri Mix',
      'Vada Mix',
      'Modak Mix',
      'Pithla Mix',
      'Zunka Mix',
      'Usal Mix',
      'Solkadhi Mix',
      'Malvani Curry Mix',
      'Kokum Curry Mix',
      'Coconut Curry Mix'
    ]
  },
  {
    name: 'FARM-TO-DOOR',
    sortOrder: 35,
    description: 'Curated farm boxes — mango, fruit, vegetable, breakfast and monthly subscription boxes delivered farm-to-door.',
    profile: 'gift',
    price: [399, 1499],
    children: [
      'Fresh Mango Box',
      'Alphonso Mango Box',
      'Devgad Mango Box',
      'Ratnagiri Mango Box',
      'Kokan Fruit Box',
      'Kokan Vegetable Box',
      'Kokan Meva Box',
      'Village Pantry Box',
      'Kokan Breakfast Box',
      'Seasonal Farm Box',
      'Monthly Kokan Farm Box'
    ]
  },
  {
    name: 'KOKAN GIFT HAMPERS',
    sortOrder: 36,
    description: 'Thoughtfully curated Konkan hampers for festivals, corporate gifting and special occasions.',
    profile: 'gift',
    price: [499, 2499],
    children: [
      'Kokan Meva Hamper',
      'Mango Hamper',
      'Cashew Hamper',
      'Kokum Hamper',
      'Malvani Hamper',
      'Gavran Food Hamper',
      'Traditional Snacks Hamper',
      'Premium Kokan Hamper',
      'Festival Kokan Hamper',
      'Corporate Kokan Hamper'
    ]
  },
  {
    name: 'DRY FISH / SEAFOOD',
    sortOrder: 37,
    description: 'Traditionally sun-dried coastal seafood — bombil, jawla, bangda, surmai, prawns, plus fish chutneys and pickles.',
    profile: 'seafood',
    price: [199, 649],
    children: [
      'Dry Bombil',
      'Dry Jawla',
      'Dry Bangda',
      'Dry Surmai',
      'Dry Kolambi',
      'Dry Prawns',
      'Dry Fish Chutney',
      'Dry Prawn Chutney',
      'Fish Pickle',
      'Prawn Pickle',
      'Dry Seafood Masala'
    ]
  },
  {
    name: 'KOKAN ROOT VEGETABLES / KANDAMULE',
    sortOrder: 38,
    description: 'Nutritious root vegetables — suran, ratalu, ratale, arbi, kachri kand and wild forest tubers.',
    profile: 'fresh',
    price: [39, 199],
    children: [
      'Suran / Elephant Foot Yam',
      'Kand / Ratalu',
      'Ratale / Sweet Potato',
      'Arbi / Alu Kand',
      'Kachri Kand',
      'Kokan Wild Tubers',
      'Gavran Kandamule',
      'Seasonal Forest Tubers'
    ]
  },
  {
    name: 'KOKAN LOCAL VEGETABLES',
    sortOrder: 39,
    description: 'Local Konkan vegetables — drumstick, tendli, kaarle, padwal, dodka, lal bhopla and shenga varieties.',
    profile: 'fresh',
    price: [29, 199],
    children: [
      'Shevga / Drumstick',
      'Shevgyachya Shenga',
      'Chavali Shenga',
      'Ghevda Shenga',
      'Gavar Shenga',
      'Val Shenga',
      'Tendli',
      'Kaarle',
      'Padwal',
      'Dudhi',
      'Dodka',
      'Lal Bhopla',
      'Suran',
      'Arbi',
      'Seasonal Gavran Vegetables'
    ]
  },
  {
    name: 'KOKAN GAVRAN / TRADITIONAL INGREDIENTS',
    sortOrder: 40,
    description: 'Traditional village pantry staples — gavran rice, jaggery, nachni, kulith, val, chawali and local millets.',
    profile: 'dry',
    price: [59, 349],
    children: [
      'Chini / Sugar',
      'Gavran Sakhar',
      'Jaggery',
      'Coconut Jaggery',
      'Rice',
      'Hand-Pounded Rice',
      'Nachni',
      'Kulith',
      'Val',
      'Chawali',
      'Gavran Dal',
      'Local Millets',
      'Traditional Village Grains'
    ]
  },
  {
    name: 'KOKAN LEAF PRODUCTS',
    sortOrder: 41,
    description: 'Eco-friendly banana, areca, palm, sal and jackfruit leaf plates, bowls, dona and tableware.',
    profile: 'craft',
    price: [49, 299],
    children: [
      'Banana Leaf',
      'Banana Leaf Plates',
      'Banana Leaf Bowls',
      'Banana Leaf Wrapping',
      'Jackfruit Leaf Plates',
      'Jackfruit Leaf Bowls',
      'Areca Leaf Plates',
      'Areca Leaf Bowls',
      'Palm Leaf Plates',
      'Palm Leaf Baskets',
      'Sal Leaf Plates',
      'Natural Leaf Dona',
      'Leaf Serving Plates',
      'Eco-Friendly Leaf Tableware'
    ]
  },
  {
    name: 'KOKAN BAMBOO PRODUCTS',
    sortOrder: 42,
    description: 'Handcrafted bamboo baskets, tokris, supas, trays, mats, storage and home decor.',
    profile: 'craft',
    price: [99, 599],
    children: [
      'Bamboo Basket',
      'Bamboo Tokri',
      'Bamboo Supa',
      'Bamboo Soop',
      'Bamboo Dalni',
      'Bamboo Storage Basket',
      'Bamboo Vegetable Basket',
      'Bamboo Fruit Basket',
      'Bamboo Tray',
      'Bamboo Mat',
      'Bamboo Stool',
      'Bamboo Flower Basket',
      'Bamboo Pen Stand',
      'Bamboo Lamp',
      'Bamboo Decorative Items'
    ]
  },
  {
    name: 'KOKAN WOODEN / LAKDI VASTU',
    sortOrder: 43,
    description: 'Traditional wooden kitchen tools — ukhal, musal, pat, varvanta, chakla, belan, spoons and storage.',
    profile: 'craft',
    price: [149, 899],
    children: [
      'Wooden Ukhal',
      'Wooden Musal',
      'Wooden Pat',
      'Wooden Varvanta',
      'Wooden Polpat',
      'Wooden Belan',
      'Wooden Spoon',
      'Wooden Ladle',
      'Wooden Serving Spoon',
      'Wooden Serving Tray',
      'Wooden Bowl',
      'Wooden Plate',
      'Wooden Glass',
      'Wooden Storage Box',
      'Wooden Masala Box',
      'Wooden Grain Box',
      'Wooden Chakla',
      'Wooden Rolling Pin',
      'Wooden Cutting Board',
      'Wooden Kitchen Tools',
      'Traditional Gavran Wooden Utensils'
    ]
  },
  {
    name: 'COCONUT SHELL PRODUCTS',
    sortOrder: 44,
    description: 'Beautiful coconut shell bowls, cups, spoons, diyas, planters and decorative crafts.',
    profile: 'craft',
    price: [49, 349],
    children: [
      'Coconut Shell Bowl',
      'Coconut Shell Cup',
      'Coconut Shell Spoon',
      'Coconut Shell Ladle',
      'Coconut Shell Planter',
      'Coconut Shell Candle Holder',
      'Coconut Shell Diya',
      'Coconut Shell Hanging',
      'Coconut Shell Keychain',
      'Coconut Shell Decorative Items',
      'Coconut Shell Craft'
    ]
  },
  {
    name: 'COCONUT FIBRE / COIR PRODUCTS',
    sortOrder: 45,
    description: 'Natural coir ropes, door mats, baskets, scrubbers, planters and coconut fibre products.',
    profile: 'craft',
    price: [49, 299],
    children: [
      'Coconut Coir Rope',
      'Coir Door Mat',
      'Coir Floor Mat',
      'Coir Basket',
      'Coir Planter',
      'Coir Hanging Basket',
      'Coir Scrubber',
      'Coconut Fibre Brush',
      'Coir Storage Basket',
      'Natural Coconut Fibre Products'
    ]
  },
  {
    name: 'KOKAN HANDCRAFTS',
    sortOrder: 46,
    description: 'Artisan handcrafted items — bamboo, cane, coconut, wooden, leaf and natural fibre crafts.',
    profile: 'craft',
    price: [99, 499],
    children: [
      'Handmade Bamboo Basket',
      'Handmade Cane Basket',
      'Handmade Coconut Craft',
      'Handmade Wooden Craft',
      'Handmade Leaf Craft',
      'Traditional Village Craft',
      'Handmade Storage Basket',
      'Handmade Serving Tray',
      'Handmade Decorative Basket',
      'Handmade Wall Decor',
      'Handmade Natural Fibre Craft',
      'Artisan Handmade Products'
    ]
  },
  {
    name: 'KOKAN CANE / KATHI PRODUCTS',
    sortOrder: 47,
    description: 'Traditional cane furniture and baskets — chairs, stools, trays, lamps and storage.',
    profile: 'craft',
    price: [149, 799],
    children: [
      'Cane Basket',
      'Cane Chair',
      'Cane Stool',
      'Cane Tray',
      'Cane Storage Basket',
      'Cane Fruit Basket',
      'Cane Flower Basket',
      'Cane Lamp',
      'Cane Decorative Items',
      'Traditional Cane Handicrafts'
    ]
  },
  {
    name: 'ECO-FRIENDLY KITCHEN PRODUCTS',
    sortOrder: 48,
    description: 'Plastic-free kitchen essentials — wooden, bamboo, coconut shell, areca leaf and coir products.',
    profile: 'craft',
    price: [59, 399],
    children: [
      'Wooden Spoon',
      'Wooden Ladle',
      'Wooden Bowl',
      'Wooden Plate',
      'Bamboo Spoon',
      'Bamboo Tray',
      'Coconut Shell Bowl',
      'Coconut Shell Spoon',
      'Areca Leaf Plate',
      'Natural Fibre Scrubber',
      'Coconut Coir Scrubber',
      'Bamboo Storage Container',
      'Natural Wood Kitchenware'
    ]
  },
  {
    name: 'ECO-FRIENDLY DINING',
    sortOrder: 49,
    description: 'Biodegradable dining ware — areca, banana leaf, bamboo, wooden and coconut shell tableware.',
    profile: 'craft',
    price: [49, 399],
    children: [
      'Areca Leaf Plate',
      'Areca Leaf Bowl',
      'Banana Leaf Plate',
      'Natural Leaf Dona',
      'Bamboo Plate',
      'Bamboo Bowl',
      'Wooden Plate',
      'Wooden Bowl',
      'Coconut Shell Bowl',
      'Coconut Shell Cup',
      'Eco-Friendly Serving Set'
    ]
  },
  {
    name: 'NATURAL HOME PRODUCTS',
    sortOrder: 50,
    description: 'Natural material home decor — bamboo, cane, coir, wooden and coconut shell accents.',
    profile: 'craft',
    price: [99, 599],
    children: [
      'Bamboo Basket',
      'Cane Basket',
      'Wooden Storage Box',
      'Wooden Tray',
      'Coconut Shell Planter',
      'Coir Planter',
      'Bamboo Planter',
      'Natural Fibre Basket',
      'Bamboo Lamp',
      'Cane Lamp',
      'Wooden Decorative Items',
      'Natural Material Home Decor'
    ]
  },
  {
    name: 'KOKAN FARM & VILLAGE TOOLS',
    sortOrder: 51,
    description: 'Traditional farm and village tools — winnowers, supas, dalnis, grain baskets and coconut scrapers.',
    profile: 'tool',
    price: [99, 699],
    children: [
      'Wooden Ukhal',
      'Wooden Musal',
      'Wooden Pat',
      'Wooden Varvanta',
      'Wooden Supa',
      'Bamboo Supa',
      'Bamboo Dalni',
      'Traditional Grain Winnower',
      'Bamboo Grain Basket',
      'Coconut Scraper',
      'Traditional Wooden Tools',
      'Handmade Farm Tools'
    ]
  },
  {
    name: 'NATURAL / SUSTAINABLE PRODUCTS',
    sortOrder: 52,
    description: 'Zero-waste, plastic-free and biodegradable products made from natural materials.',
    profile: 'craft',
    price: [99, 449],
    children: [
      'Coconut Coir Products',
      'Bamboo Products',
      'Cane Products',
      'Wooden Products',
      'Leaf Products',
      'Coconut Shell Products',
      'Natural Fibre Products',
      'Handmade Village Products',
      'Plastic-Free Kitchen Products',
      'Biodegradable Tableware',
      'Reusable Natural Products',
      'Zero-Waste Home Products'
    ]
  },
  {
    name: 'KOKAN VILLAGE SPECIALS',
    sortOrder: 53,
    description: 'Heritage village collections — traditional utensils, handicrafts, artisan-made products and eco collections.',
    profile: 'craft',
    price: [199, 999],
    children: [
      'Gavran Kitchen Collection',
      'Traditional Kokan Utensils',
      'Traditional Kokan Handicrafts',
      'Village Handmade Collection',
      'Farmer-Made Products',
      'Artisan-Made Products',
      'Seasonal Village Products',
      'Natural Forest Products',
      'Kokan Heritage Collection',
      'Kokan Eco Collection'
    ]
  }
];
