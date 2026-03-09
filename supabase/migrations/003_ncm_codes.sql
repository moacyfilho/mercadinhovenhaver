-- Tabela de códigos NCM
CREATE TABLE IF NOT EXISTS ncm_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  aliquota_ipi DECIMAL(5,2) DEFAULT 0
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_ncm_codes_code ON ncm_codes(code);
CREATE INDEX IF NOT EXISTS idx_ncm_codes_description ON ncm_codes USING gin(to_tsvector('portuguese', description));

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  NCM Codes — Mini Mercado / Supermercado Brasileiro             ║
-- ╚══════════════════════════════════════════════════════════════════╝

INSERT INTO ncm_codes (code, description) VALUES
-- CARNES E AVES
('02011000','Carcaças e meias-carcaças de bovinos, frescas ou refrigeradas'),
('02013000','Desossadas de bovinos, frescas ou refrigeradas'),
('02021000','Carcaças e meias-carcaças de bovinos, congeladas'),
('02023000','Desossadas de bovinos, congeladas'),
('02031100','Carcaças e meias-carcaças de suínos, congeladas'),
('02032900','Outras carnes de suínos, congeladas'),
('02071100','Galinhas não cortadas em pedaços, frescas ou refrigeradas'),
('02071200','Galinhas não cortadas em pedaços, congeladas'),
('02071300','Pedaços e miudezas de galinhas, frescos ou refrigerados'),
('02071400','Pedaços e miudezas de galinhas, congelados'),
('02101100','Pernas, patas e respectivos pedaços, de suínos (presunto e pernil)'),

-- PEIXES E FRUTOS DO MAR
('03025400','Tilápia, fresca ou refrigerada'),
('03035400','Tilápia, congelada'),
('03054900','Peixes defumados (exceto filés)'),
('03061700','Camarões, congelados'),

-- LEITE E LATICÍNIOS
('04011000','Leite e creme de leite, não concentrados, com teor de gordura <= 1%'),
('04012000','Leite e creme de leite, não concentrados, com teor de gordura > 1% e <= 6%'),
('04021000','Leite em pó, com teor de gordura <= 1,5%'),
('04022100','Leite em pó, sem adição de açúcar, com teor de gordura > 1,5%'),
('04031000','Iogurte'),
('04039000','Leitelho, leite e creme coalhados, kefir'),
('04041000','Soro de leite, mesmo modificado'),
('04051000','Manteiga'),
('04061000','Queijo fresco, incluindo o soro de manteiga, e requeijão'),
('04063000','Queijo fundido, exceto ralado ou em pó'),
('04064000','Queijo de pasta azul e outros queijos que apresentem veias'),
('04069000','Outros queijos'),
('04090000','Mel natural'),

-- OVOS
('04070011','Ovos de galinha, frescos'),
('04070019','Outros ovos de aves, frescos'),

-- FRUTAS E VEGETAIS
('07019000','Batatas, frescas ou refrigeradas'),
('07020000','Tomates, frescos ou refrigerados'),
('07031000','Cebolas e chalota, frescas ou refrigeradas'),
('07032000','Alho, fresco ou refrigerado'),
('07051100','Alface repolhuda, fresca ou refrigerada'),
('07070000','Pepinos e pepinos para conserva'),
('07092200','Azeitonas'),
('07096000','Pimentões e pimentas capsicum'),
('07101000','Batatas, congeladas'),
('07108000','Outros legumes, congelados'),
('08011100','Cocos secos'),
('08019000','Outros cocos, castanhas de caju e castanhas-do-pará'),
('08021100','Amêndoas com casca'),
('08023100','Nozes com casca'),
('08031000','Bananas do tipo Plantain, frescas ou secas'),
('08039000','Outras bananas, frescas ou secas'),
('08041000','Tâmaras, frescas ou secas'),
('08043000','Abacaxis (ananás), frescos ou secos'),
('08051000','Laranjas, frescas ou secas'),
('08052000','Tangerinas, clementinas, wilkings e híbridos similares'),
('08061000','Uvas frescas'),
('08071100','Melancias, frescas'),
('08081000','Maçãs, frescas'),
('08094000','Ameixas e abrunhos, frescos'),
('08101000','Morangos, frescos'),

-- CEREAIS E GRÃOS
('10011900','Trigo (exceto para semeadura)'),
('10059000','Milho (exceto para semeadura)'),
('10063000','Arroz semibranqueado ou branqueado'),
('10086000','Grãos de quinoa'),
('07133300','Feijão-comum, seco, sem casca'),
('07133900','Outros feijões secos'),

-- FARINHAS E AMIDOS
('11010010','Farinha de trigo'),
('11022000','Farinha de milho'),
('11031300','Pellets de milho'),
('11041900','Grãos de aveia trabalhados de outros modos'),
('11081100','Amido de trigo'),
('11081200','Amido de milho'),
('11090000','Glúten de trigo'),

-- ÓLEOS E GORDURAS
('15071000','Óleo de soja, em bruto'),
('15079000','Óleo de soja refinado'),
('15111000','Óleo de palma, em bruto'),
('15119000','Óleo de palma refinado'),
('15141100','Óleo de canola, em bruto'),
('15141900','Óleo de canola refinado'),
('15161000','Gorduras e óleos animais, hidrogenados'),
('15162000','Gorduras e óleos vegetais, hidrogenados (gordura vegetal)'),
('15179000','Margarina e preparações alimentícias'),

-- AÇÚCARES E DOCES
('17011400','Açúcar de cana refinado'),
('17019900','Outros açúcares de cana ou beterraba'),
('17021100','Lactose e xarope de lactose'),
('17031000','Melaço de cana'),
('17041000','Goma de mascar'),
('17049000','Outros produtos de confeitaria sem cacau (balas, pirulitos, caramelos)'),
('18050000','Cacau em pó sem adição de açúcar'),
('18069000','Chocolate e outras preparações alimentícias contendo cacau'),

-- CAFÉ, CHÁ E MATE
('09011100','Café não torrado, não descafeinado'),
('09011200','Café não torrado, descafeinado'),
('09012100','Café torrado, não descafeinado'),
('09012200','Café torrado, descafeinado'),
('09021000','Chá verde, acondicionado'),
('09024000','Outro chá, acondicionado'),
('09030000','Mate (erva-mate)'),

-- MASSAS, BISCOITOS E PÃES
('19011000','Preparações para alimentação infantil'),
('19012000','Misturas e pastas para preparação de produtos de padaria'),
('19019900','Outras farinhas, grumos e farelos de cereais'),
('19021100','Massas alimentícias não cozidas (macarrão, espaguete)'),
('19022000','Massas alimentícias recheadas'),
('19023000','Outras massas alimentícias'),
('19024000','Cuscuz'),
('19030000','Tapioca e seus sucedâneos preparados a partir da fécula de mandioca'),
('19041000','Produtos à base de cereais (corn flakes, flocos, granola)'),
('19042000','Preparações alimentícias obtidas com flocos de cereais não torrados'),
('19051000','Pão crocante denominado Knäckebrot'),
('19052000','Pão de gengibre e produtos semelhantes'),
('19053100','Bolachas e biscoitos, adicionados de edulcorante'),
('19053200','Waffles e wafers'),
('19059000','Outros produtos de padaria (pão, torradas, bolos)'),

-- CONSERVAS E ENLATADOS
('20019000','Outras hortaliças, frutas e plantas comestíveis em vinagre'),
('20021000','Tomates inteiros ou em pedaços'),
('20029000','Outros preparados de tomate (extrato, molho)'),
('20041000','Batatas preparadas ou conservadas (exceto em vinagre), congeladas'),
('20049000','Outros legumes preparados, congelados'),
('20052000','Batatas preparadas ou conservadas (exceto em vinagre), não congeladas'),
('20060000','Hortaliças, frutas, cascas em açúcar'),
('20071000','Preparações homogeneizadas de frutas (papinhas)'),
('20079100','Doces, geléias, marmeladas de frutas cítricas'),
('20079900','Outras geleias e doces de frutas'),
('20082000','Abacaxis preparados ou conservados'),
('20083000','Frutas cítricas, preparadas ou conservadas'),
('20084000','Peras, preparadas ou conservadas'),
('20085000','Damascos, preparados ou conservados'),
('20086000','Cerejas, preparadas ou conservadas'),
('20087000','Pêssegos, preparados ou conservados'),
('20089200','Misturas de frutas preparadas ou conservadas'),
('20091100','Suco de laranja, congelado, não fermentado'),
('20091200','Suco de laranja, não congelado, não fermentado'),
('20094100','Suco de abacaxi, não fermentado'),
('20097100','Suco de maçã, não fermentado'),
('20099000','Mistura de sucos de frutas'),

-- CONDIMENTOS E TEMPEROS
('21011100','Extratos, essências e concentrados de café'),
('21012000','Extratos, essências e concentrados de chá ou mate'),
('21031000','Molho de soja'),
('21032000','Ketchup e outros molhos de tomate'),
('21033000','Mostarda e farinha de mostarda preparada'),
('21039000','Outros molhos e preparações (maionese, vinagre de vinho)'),
('21041000','Preparações para caldos e sopas'),
('21050000','Sorvetes e outros gelos comestíveis'),
('21061000','Concentrados de proteínas e substâncias proteicas texturizadas'),
('21069090','Outras preparações alimentícias (temperos prontos, mistura de especiarias)'),
('09041100','Pimenta-do-reino, seca'),
('09042200','Pimentas capsicum, trituradas ou em pó'),
('09101100','Gengibre, seco'),
('09109900','Outras especiarias e ervas aromáticas'),

-- BEBIDAS
('22011000','Água mineral natural ou artificialmente gaseificada'),
('22019000','Outras águas e gelo'),
('22021000','Água, incluindo água mineral e gaseificada com açúcar ou adoçante'),
('22029000','Outras bebidas não alcoólicas (refrigerantes, isotônicos, energéticos)'),
('22030000','Cervejas de malte'),
('22041000','Vinho espumante'),
('22042100','Outros vinhos, em recipientes de capacidade não superior a 2 l'),
('22051000','Vermute e outros vinhos de uvas frescas aromatizados'),
('22071000','Álcool etílico não desnaturado, com um teor alcoólico >= 80%'),
('22082000','Aguardentes de vinho (conhaque, brandy)'),
('22083000','Uísque (whisky)'),
('22084000','Rum e outras aguardentes provenientes da fermentação e destilação'),
('22085000','Gin e genebra'),
('22086000','Vodca'),
('22089000','Cachaça e outras bebidas espirituosas'),

-- LIMPEZA E HIGIENE
('33051000','Xampus (shampoos)'),
('33052000','Preparações para ondulação ou alisamento permanente dos cabelos'),
('33053000','Laquês para o cabelo'),
('33054000','Outras preparações capilares (condicionador)'),
('33061000','Dentifrícios (creme dental)'),
('33062000','Fio dental'),
('33069000','Outras preparações para higiene bucal (enxaguatórios)'),
('33071000','Preparações para barbear (antes, durante ou após)'),
('33072000','Desodorantes e antiperspirantes'),
('33074900','Outros produtos de perfumaria, cosméticos e preparações de toucador'),
('34011100','Sabão de toucador'),
('34011900','Outros sabões, em barras, pedaços ou figuras moldadas'),
('34012000','Sabão em outras formas (flocos, grânulos, pó)'),
('34021100','Alquilbenzenos sulfonados (detergente em pó)'),
('34021300','Outros tensoativos aniônicos (detergente líquido)'),
('34022090','Preparações tensoativas (sabão líquido, detergente multiuso)'),
('34029000','Preparações para lavar roupa (sabão em pó, amaciante)'),
('38089400','Desinfetantes (água sanitária, álcool)'),

-- PAPEL E DESCARTÁVEIS
('48182000','Lenços, incluindo os de maquilagem e de desmaquilar'),
('48183000','Toalhas e guardanapos de uso doméstico'),
('48184000','Fraldas para bebê'),
('48189000','Papel higiênico, absorvente íntimo, papel toalha'),
('39232100','Sacos e sacolas de polietileno'),
('39232900','Outros sacos e sacolas de plástico'),

-- PRODUTOS DE BEBÊ
('21061000','Preparações alimentícias para lactentes e crianças pequenas'),
('33071000','Preparações para bebê'),

-- MATERIAL ESCOLAR E ESCRITÓRIO
('96081000','Canetas esferográficas'),
('48201000','Cadernos'),
('48211000','Etiquetas e rótulos de papel'),

ON CONFLICT (code) DO NOTHING;
