-- =========================
-- STATES (GOVERNORATES)
-- =========================

INSERT INTO states (name) VALUES
('Tunis'),
('Ariana'),
('Ben Arous'),
('Manouba'),
('Nabeul'),
('Zaghouan'),
('Bizerte'),
('Beja'),
('Jendouba'),
('Kef'),
('Siliana'),
('Sousse'),
('Monastir'),
('Mahdia'),
('Sfax'),
('Kairouan'),
('Kasserine'),
('Sidi Bouzid'),
('Gabes'),
('Mednine'),
('Tataouine'),
('Gafsa'),
('Tozeur'),
('Kebili');


-- =========================
-- CITIES
-- NOTE: state_id assumes auto-increment order above
-- =========================

INSERT INTO cities (name, state_id) VALUES

-- Tunis (1)
('Tunis Centre', 1),
('La Marsa', 1),
('Carthage', 1),
('Le Bardo', 1),
('Ariana Ville', 2),
('Raoued', 2),
('Ben Arous', 3),
('Radès', 3),
('Manouba', 4),
('Douar Hicher', 4),

-- Nabeul (5)
('Nabeul', 5),
('Hammamet', 5),
('Kelibia', 5),

-- Zaghouan (6)
('Zaghouan', 6),
('El Fahs', 6),

-- Bizerte (7)
('Bizerte', 7),
('Menzel Bourguiba', 7),

-- Beja (8)
('Beja', 8),
('Medjez el-Bab', 8),

-- Jendouba (9)
('Jendouba', 9),
('Tabarka', 9),

-- Kef (10)
('Le Kef', 10),

-- Siliana (11)
('Siliana', 11),

-- Sousse (12)
('Sousse Medina', 12),
('Hammam Sousse', 12),
('Msaken', 12),

-- Monastir (13)
('Monastir', 13),
('Ksar Hellal', 13),

-- Mahdia (14)
('Mahdia', 14),
('Chebba', 14),

-- Sfax (15)
('Sfax Ville', 15),
('Sakiet Ezzit', 15),
('Sakiet Eddaier', 15),

-- Kairouan (16)
('Kairouan', 16),

-- Kasserine (17)
('Kasserine', 17),

-- Sidi Bouzid (18)
('Sidi Bouzid', 18),

-- Gabes (19)
('Gabes', 19),

-- Mednine (20)
('Mednine', 20),
('Djerba Houmt Souk', 20),

-- Tataouine (21)
('Tataouine', 21),

-- Gafsa (22)
('Gafsa', 22),

-- Tozeur (23)
('Tozeur', 23),

-- Kebili (24)
('Kebili', 24);