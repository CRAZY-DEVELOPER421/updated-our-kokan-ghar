USE konkan_bazaar;

-- ============================================
-- STEP 1: Delete old product_images (5 old records)
-- ============================================
DELETE FROM product_images;

-- ============================================
-- STEP 2: Insert new product_images
-- ============================================

-- Mangoes & Fruits (IDs 1-23)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(1, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600', 'Devgad Alphonso Mango Box Premium', 0, 1),
(2, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600', 'Ratnagiri Alphonso Mangoes Family Pack', 0, 1),
(3, 'https://images.unsplash.com/photo-1605027990121-cbae9e0642b0?w=600', 'Devgad Hapus Mango Pulp Jar', 0, 1),
(4, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600', 'Alphonso Mango Gift Hamper', 0, 1),
(5, 'https://images.unsplash.com/photo-1518889735218-3e3a03fd3128?w=600', 'Payri Mango Dozen', 0, 1),
(6, 'https://images.unsplash.com/photo-1507552872676-45b800ca66c3?w=600', 'Mankurad Goan Mango Dozen', 0, 1),
(7, 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=600', 'Kesar Mango Dozen', 0, 1),
(8, 'https://images.unsplash.com/photo-1559181567-c3190bfbf70e?w=600', 'Dried Mango Slices', 0, 1),
(9, 'https://images.unsplash.com/photo-1519096845289-95806ee03a1a?w=600', 'Raw Green Mango', 0, 1),
(10, 'https://images.unsplash.com/photo-1602541372798-dc45f6f6e94c?w=600', 'Totapuri Mango', 0, 1),
(11, 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600', 'Mango Squash Concentrate Bottle', 0, 1),
(12, 'https://images.unsplash.com/photo-1596591868231-05e808fd131d?w=600', 'Kokum Dried Organic Fruit', 0, 1),
(13, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600', 'Mango Jam Alphonso Jar', 0, 1),
(14, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600', 'Raw Mango Powder Amchur', 0, 1),
(15, 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600', 'Rajeli Banana Dozen', 0, 1),
(16, 'https://images.unsplash.com/photo-1554010702-77a7e2e0e69a?w=600', 'Custard Apple Sitaphal', 0, 1),
(17, 'https://images.unsplash.com/photo-1559181567-c3190bfbf70e?w=600', 'Fresh Tender Coconut', 0, 1),
(18, 'https://images.unsplash.com/photo-1610478920765-a4de5bc748e2?w=600', 'Packaged Coconut Water', 0, 1),
(19, 'https://images.unsplash.com/photo-1563289217-bf87b9702b5a?w=600', 'Fresh Watermelon', 0, 1),
(20, 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=600', 'Fresh Papaya Madhu Bindu', 0, 1),
(21, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600', 'Fresh Pineapple', 0, 1),
(22, 'https://images.unsplash.com/photo-1601379329542-31c59347e2b0?w=600', 'Dried Fig Anjeer', 0, 1),
(23, 'https://images.unsplash.com/photo-1596591868229-05e808fd130c?w=600', 'Organic Jamun Fruit', 0, 1);

-- Coastal Seafood (IDs 24-36)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(24, 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600', 'Sundried Bombay Duck Bombil', 0, 1),
(25, 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600', 'Sundried Prawns Sungta', 0, 1),
(26, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600', 'Sundried Mackerel Bangda', 0, 1),
(27, 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600', 'Sundried Shrimp Kolambi', 0, 1),
(28, 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600', 'Fresh King Prawns Raw', 0, 1),
(29, 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=600', 'Fresh Pomfret Whole', 0, 1),
(30, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600', 'Fresh Bangda Mackerel', 0, 1),
(31, 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=600', 'Fresh Surmai Kingfish Steaks', 0, 1),
(32, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600', 'Malvani Fish Curry Masala', 0, 1),
(33, 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=600', 'Prawn Pickle Kolambi Lonche', 0, 1),
(34, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600', 'Bangda Fry Masala', 0, 1),
(35, 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600', 'Dried Anchovies Kati', 0, 1),
(36, 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=600', 'Goan Recheado Masala Paste', 0, 1);

-- Coconut Products (IDs 37-47)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(37, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600', 'Cold Pressed Coconut Oil 1L', 0, 1),
(38, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600', 'Virgin Coconut Oil Organic 500ml', 0, 1),
(39, 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600', 'Desiccated Coconut Powder', 0, 1),
(40, 'https://images.unsplash.com/photo-1559181567-c3190bfbf70e?w=600', 'Coconut Milk Fresh', 0, 1),
(41, 'https://images.unsplash.com/photo-1561136594-7f68413baa99?w=600', 'Coconut Cream Thick', 0, 1),
(42, 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600', 'Dry Coconut Copra', 0, 1),
(43, 'https://images.unsplash.com/photo-1559181567-c3190bfbf70e?w=600', 'Roasted Coconut Chips', 0, 1),
(44, 'https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=600', 'Coconut Vinegar Bottle', 0, 1),
(45, 'https://images.unsplash.com/photo-1601001815894-4bb6c829a8a4?w=600', 'Organic Coconut Sugar', 0, 1),
(46, 'https://images.unsplash.com/photo-1548365328-8c6db3220e4d?w=600', 'Coconut Laddu Traditional', 0, 1),
(47, 'https://images.unsplash.com/photo-1548365328-8c6db3220e4d?w=600', 'Coconut Barfi Sweet', 0, 1);

-- Konkan Rice (IDs 48-57)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(48, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', 'Indrayani Rice Premium 5kg', 0, 1),
(49, 'https://images.unsplash.com/photo-1536304993881-ff86e8d7f1b0?w=600', 'Ambemohar Rice 5kg', 0, 1),
(50, 'https://images.unsplash.com/photo-1602520916-d58cfb8e9c72?w=600', 'Organic Red Rice 5kg', 0, 1),
(51, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', 'Govind Bhog Rice 5kg', 0, 1),
(52, 'https://images.unsplash.com/photo-1536304993881-ff86e8d7f1b0?w=600', 'Basmati Rice Konkan Gold', 0, 1),
(53, 'https://images.unsplash.com/photo-1602520916-d58cfb8e9c72?w=600', 'Organic Brown Rice 5kg', 0, 1),
(54, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', 'Kolam Rice 5kg', 0, 1),
(55, 'https://images.unsplash.com/photo-1595521652820-7d1b99f8e60e?w=600', 'Rice Flakes Poha Indrayani', 0, 1),
(56, 'https://images.unsplash.com/photo-1614350292382-c448d0110dfa?w=600', 'Puffed Rice Murmura', 0, 1),
(57, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600', 'Organic Rice Flour 2kg', 0, 1);

-- Kokum & Beverages (IDs 58-68)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(58, 'https://images.unsplash.com/photo-1561636042-2e97af6e7e40?w=600', 'Sol Kadhi Concentrate Bottle', 0, 1),
(59, 'https://images.unsplash.com/photo-1596591868231-05e808fd131d?w=600', 'Kokum Juice Ready to Drink', 0, 1),
(60, 'https://images.unsplash.com/photo-1596591868231-05e808fd131d?w=600', 'Dried Kokum Rind 250g', 0, 1),
(61, 'https://images.unsplash.com/photo-1561636042-2e97af6e7e40?w=600', 'Kokum Syrup Concentrate 500ml', 0, 1),
(62, 'https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=600', 'Tamarind Concentrate Bottle', 0, 1),
(63, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', 'Fresh Lime Juice 1L', 0, 1),
(64, 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600', 'Packaged Sugarcane Juice', 0, 1),
(65, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600', 'Buttermilk Masala Chaas Mix', 0, 1),
(66, 'https://images.unsplash.com/photo-1605027990121-cbae9e0642b0?w=600', 'Aamras Mango Pulp 500g', 0, 1),
(67, 'https://images.unsplash.com/photo-1610478920765-a4de5bc748e2?w=600', 'Tender Coconut Water Tetra', 0, 1),
(68, 'https://images.unsplash.com/photo-1561636042-2e97af6e7e40?w=600', 'Kokum Sharbat Concentrate 1L', 0, 1);

-- Cashew & Dry Fruits (IDs 80-91)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(80, 'https://images.unsplash.com/photo-1604210528297-e593c74a0db3?w=600', 'Roasted Salted Cashew Nuts', 0, 1),
(81, 'https://images.unsplash.com/photo-1543158266-0066955047b1?w=600', 'Raw Premium Cashew Nuts W180', 0, 1),
(82, 'https://images.unsplash.com/photo-1604210528297-e593c74a0db3?w=600', 'Masala Spiced Cashew Nuts', 0, 1),
(83, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600', 'Honey Roasted Cashews', 0, 1),
(84, 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600', 'Cashew Feni Goa Premium Bottle', 0, 1),
(85, 'https://images.unsplash.com/photo-1543158266-0066955047b1?w=600', 'Cashew Pieces Cooking Grade', 0, 1),
(86, 'https://images.unsplash.com/photo-1604210528297-e593c74a0db3?w=600', 'Cashew Butter Unsweetened Jar', 0, 1),
(87, 'https://images.unsplash.com/photo-1548365328-8c6db3220e4d?w=600', 'Kaju Katli Premium Cashew Sweet', 0, 1),
(88, 'https://images.unsplash.com/photo-1561636042-2e97af6e7e40?w=600', 'Cashew Milk Unsweetened Carton', 0, 1),
(89, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600', 'Mamra Almonds Premium', 0, 1),
(90, 'https://images.unsplash.com/photo-1604210528297-e593c74a0db3?w=600', 'Salted Cashew Bulk 1kg', 0, 1),
(91, 'https://images.unsplash.com/photo-1604210528297-e593c74a0db3?w=600', 'Extra Hot Spicy Cashew 500g', 0, 1);

-- Jaggery & Sweeteners (IDs 103-109)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(103, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600', 'Organic Pure Jaggery Block', 0, 1),
(104, 'https://images.unsplash.com/photo-1601601392545-bbed4d62f6c5?w=600', 'Palm Jaggery Karupatti Block', 0, 1),
(105, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600', 'Organic Coconut Jaggery', 0, 1),
(106, 'https://images.unsplash.com/photo-1599579626927-27b45ae867eb?w=600', 'Organic Jaggery Powder Fine Ground', 0, 1),
(107, 'https://images.unsplash.com/photo-1582901887163-0e6e5e684570?w=600', 'Wild Raw Honey Sahyadri Forest', 0, 1),
(108, 'https://images.unsplash.com/photo-1582901887163-0e6e5e684570?w=600', 'Multiflora Honey Konkan Blossom', 0, 1),
(109, 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600', 'Natural Date Syrup Bottle', 0, 1);

-- Traditional Snacks (IDs 110-119)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(110, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600', 'Konkan Chakli Crispy Spiral Snack', 0, 1),
(111, 'https://images.unsplash.com/photo-1595521652820-7d1b99f8e60e?w=600', 'Kanda Poha Instant Mix', 0, 1),
(112, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', 'Jowar Bhakri Traditional Konkan', 0, 1),
(113, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600', 'Spicy Murukku Crispy Snack', 0, 1),
(114, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600', 'Chivda Pohe Mixture Konkan', 0, 1),
(115, 'https://images.unsplash.com/photo-1595521652820-7d1b99f8e60e?w=600', 'Sabudana Khichdi Instant Mix', 0, 1),
(116, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600', 'Roasted Bengal Gram Daliya', 0, 1),
(117, 'https://images.unsplash.com/photo-1548365328-8c6db3220e4d?w=600', 'Peanut Chikki Jaggery Konkan', 0, 1),
(118, 'https://images.unsplash.com/photo-1548365328-8c6db3220e4d?w=600', 'Til Sesame Laddoo Winter Sweet', 0, 1),
(119, 'https://images.unsplash.com/photo-1548365328-8c6db3220e4d?w=600', 'Puran Poli Ready to Eat', 0, 1);

-- Handmade Crafts (IDs 120-124)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(120, 'https://images.unsplash.com/photo-1602928298849-9f5f78d57bd1?w=600', 'Handwoven Bamboo Basket Medium', 0, 1),
(121, 'https://images.unsplash.com/photo-1604689598793-b8bf1dc445a1?w=600', 'Konkan Clay Diya Lamp Set', 0, 1),
(122, 'https://images.unsplash.com/photo-1602928298849-9f5f78d57bd1?w=600', 'Coconut Shell Carved Souvenir', 0, 1),
(123, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'Konkan Handloom Cotton Towel', 0, 1),
(124, 'https://images.unsplash.com/photo-1599579626927-27b45ae867eb?w=600', 'Wooden Spice Box Mango Wood', 0, 1);

-- Monsoon Specials (IDs 125-130)
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(125, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600', 'Monsoon Bhajji Mix Pakora', 0, 1),
(126, 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600', 'Dried Shrimp Bhaji Mix Coastal', 0, 1),
(127, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'Konkan Masala Chai Mix Tea', 0, 1),
(128, 'https://images.unsplash.com/photo-1601001815894-4bb6c829a8a4?w=600', 'Bhutta Corn Roasted Masala', 0, 1),
(129, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600', 'Konkan Tomato Rasam Soup Mix', 0, 1),
(130, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600', 'Bhel Puri Mix Instant Snack', 0, 1);
