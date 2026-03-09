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
-- ║  NCM Codes — Mini Mercado / Supermercado Brasileiro (completo)  ║
-- ╚══════════════════════════════════════════════════════════════════╝

INSERT INTO ncm_codes (code, description) VALUES

-- ══════════════════════════════════════════════
-- CAPÍTULO 02 — CARNES E MIUDEZAS COMESTÍVEIS
-- ══════════════════════════════════════════════
('02011000','Carcaças e meias-carcaças de bovinos, frescas ou refrigeradas'),
('02012000','Outros cortes não desossados de bovinos, frescos ou refrigerados'),
('02013000','Cortes desossados de bovinos, frescos ou refrigerados'),
('02021000','Carcaças e meias-carcaças de bovinos, congeladas'),
('02022000','Outros cortes não desossados de bovinos, congelados'),
('02023000','Cortes desossados de bovinos, congelados'),
('02031100','Carcaças e meias-carcaças de suínos, congeladas'),
('02031200','Pernas, patas e respectivos pedaços de suínos, congelados'),
('02031900','Outros cortes de suínos, congelados'),
('02032100','Carcaças e meias-carcaças de suínos, frescas ou refrigeradas'),
('02032200','Pernas, patas e pedaços de suínos, frescos ou refrigerados'),
('02032900','Outras carnes de suínos, frescas, refrigeradas ou congeladas'),
('02041000','Carcaças e meias-carcaças de ovinos, frescas ou refrigeradas'),
('02042200','Outros cortes não desossados de ovinos, frescos ou refrigerados'),
('02042300','Cortes desossados de ovinos, frescos ou refrigerados'),
('02050000','Carnes de animais da espécie equina, fresca, refrigerada ou congelada'),
('02061000','Miudezas comestíveis de bovinos, frescas ou refrigeradas'),
('02062200','Línguas de bovinos, congeladas'),
('02062900','Outras miudezas de bovinos, congeladas'),
('02064900','Outras miudezas de suínos, congeladas'),
('02071100','Galinhas não cortadas em pedaços, frescas ou refrigeradas'),
('02071200','Galinhas não cortadas em pedaços, congeladas'),
('02071300','Pedaços e miudezas de galinhas, frescos ou refrigerados'),
('02071400','Pedaços e miudezas de galinhas, congelados'),
('02072500','Perus não cortados em pedaços, frescos ou refrigerados'),
('02072600','Perus não cortados em pedaços, congelados'),
('02072700','Pedaços e miudezas de perus, frescos ou refrigerados'),
('02072800','Pedaços e miudezas de perus, congelados'),
('02081000','Carnes de coelhos ou lebres, frescas, refrigeradas ou congeladas'),
('02101100','Pernas, patas e pedaços de suínos salgados — presunto e pernil'),
('02101200','Barrigas de suínos salgadas — bacon'),
('02101900','Outras carnes de suínos salgadas, secas ou defumadas'),
('02102000','Carnes de bovinos, salgadas, secas ou defumadas'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 03 — PEIXES, CRUSTÁCEOS E MOLUSCOS
-- ══════════════════════════════════════════════
('03025400','Tilápia, fresca ou refrigerada'),
('03026100','Sardinhas, frescas ou refrigeradas'),
('03026300','Bacalhau, fresco ou refrigerado'),
('03026900','Outros peixes, frescos ou refrigerados'),
('03027900','Atum, fresco ou refrigerado'),
('03028900','Outros peixes de mar, frescos ou refrigerados'),
('03033100','Atuns, congelados'),
('03035400','Tilápia, congelada'),
('03036100','Sardinhas, congeladas'),
('03037900','Outros filés de peixes, congelados'),
('03038900','Outros peixes, congelados'),
('03042000','Filés de peixes defumados'),
('03044200','Filés de tilápia, frescos ou refrigerados'),
('03044900','Filés de outros peixes, frescos ou refrigerados'),
('03051000','Farinhas, pós e pellets de peixes'),
('03054100','Salmão defumado'),
('03054900','Outros peixes defumados'),
('03055100','Bacalhau, seco, não defumado'),
('03055900','Outros peixes secos'),
('03056200','Bacalhau salgado — verde'),
('03056900','Outros peixes salgados ou em salmoura'),
('03061400','Caranguejos, congelados'),
('03061700','Camarões, congelados'),
('03062100','Lagostas, vivas, frescas ou refrigeradas'),
('03062400','Caranguejos, vivos, frescos ou refrigerados'),
('03062800','Outros crustáceos, frescos ou refrigerados'),
('03071100','Ostras, vivas, frescas ou refrigeradas'),
('03072100','Vieiras, vivas, frescas ou refrigeradas'),
('03073100','Mexilhões, vivos, frescos ou refrigerados'),
('03074300','Lulas, frescas ou refrigeradas'),
('03074900','Outros cefalópodes, frescos ou refrigerados'),
('03079900','Outros moluscos, frescos ou refrigerados'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 04 — LEITE, LATICÍNIOS, OVOS E MEL
-- ══════════════════════════════════════════════
('04011000','Leite fluido com teor de gordura ≤ 1% — leite desnatado'),
('04012000','Leite fluido com teor de gordura > 1% e ≤ 6% — leite semidesnatado'),
('04013000','Leite fluido com teor de gordura > 6% — leite integral'),
('04021000','Leite em pó desnatado, teor de gordura ≤ 1,5%'),
('04022100','Leite em pó integral, sem adição de açúcar, teor de gordura > 1,5%'),
('04022900','Leite em pó com adição de açúcar — leite em pó adoçado'),
('04029100','Leite condensado sem adição de açúcar'),
('04029900','Leite condensado adoçado'),
('04031000','Iogurte natural'),
('04032000','Iogurte com frutas ou aromatizado — bebida láctea'),
('04039000','Leitelho, kefir e outros produtos lácteos fermentados'),
('04041000','Soro de leite, mesmo modificado'),
('04051000','Manteiga'),
('04052000','Pasta de espalhar láctea — creme de leite para passar'),
('04059000','Outras gorduras e óleos provenientes do leite — ghee'),
('04061000','Queijo fresco — requeijão, ricota, cottage'),
('04062000','Queijo ralado ou em pó — parmesão ralado'),
('04063000','Queijo fundido — requeijão cremoso'),
('04064000','Queijo de pasta azul — gorgonzola'),
('04069011','Queijo mozarela'),
('04069021','Queijo prato'),
('04069031','Queijo coalho'),
('04069041','Queijo gouda'),
('04069051','Queijo parmesão'),
('04069061','Queijo edam'),
('04069071','Queijo cheddar'),
('04069090','Outros queijos não especificados'),
('04070011','Ovos de galinha, frescos, para consumo'),
('04070019','Outros ovos de aves, frescos'),
('04090000','Mel natural de abelha'),
('04100000','Outros produtos comestíveis de origem animal'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 07 — PRODUTOS HORTÍCOLAS
-- ══════════════════════════════════════════════
('07011000','Batatas para semente'),
('07019000','Outras batatas, frescas ou refrigeradas'),
('07020000','Tomates, frescos ou refrigerados'),
('07031000','Cebolas e chalota, frescas ou refrigeradas'),
('07032000','Alho, fresco ou refrigerado'),
('07033000','Alho-poró e outros hortícolas aliáceos'),
('07041000','Couve-flor e brócolis, frescos ou refrigerados'),
('07042000','Couve-de-bruxelas, fresca ou refrigerada'),
('07049000','Outras couves, frescas ou refrigeradas'),
('07051100','Alface repolhuda, fresca ou refrigerada'),
('07051900','Outras alfaces, frescas ou refrigeradas'),
('07052100','Chicória, fresca ou refrigerada'),
('07061000','Cenouras e nabos, frescos ou refrigerados'),
('07062000','Beterrabas, frescas ou refrigeradas'),
('07070000','Pepinos e pepinos para conserva, frescos ou refrigerados'),
('07081000','Ervilhas, frescas ou refrigeradas — ervilha torta'),
('07082000','Feijões, frescos ou refrigerados — feijão vagem'),
('07089000','Outras leguminosas, frescas ou refrigeradas'),
('07092000','Aspargos, frescos ou refrigerados'),
('07094000','Aipo, fresco ou refrigerado — salsão'),
('07095100','Cogumelos, frescos ou refrigerados'),
('07096000','Pimentões e pimentas capsicum, frescos ou refrigerados'),
('07097000','Espinafres, frescos ou refrigerados'),
('07099200','Azeitonas, frescas ou refrigeradas'),
('07099300','Abóboras e abobrinhas, frescas ou refrigeradas'),
('07099900','Outros produtos hortícolas, frescos ou refrigerados'),
('07101000','Batatas, congeladas'),
('07102200','Feijões, congelados'),
('07103000','Espinafres, congelados'),
('07108000','Outros legumes congelados — milho verde, ervilha congelada'),
('07109000','Misturas de hortaliças, congeladas'),
('07122000','Cebolas desidratadas'),
('07123200','Cogumelos shiitake, secos'),
('07123900','Outros cogumelos secos'),
('07129000','Outros hortícolas secos'),
('07131000','Ervilhas secas, com casca'),
('07132000','Grão-de-bico, seco'),
('07133100','Feijão-mungo, seco'),
('07133200','Feijão-azuki, seco'),
('07133300','Feijão-comum (Phaseolus vulgaris), seco'),
('07133900','Outros feijões secos'),
('07134000','Lentilhas, secas'),
('07135000','Favas, secas'),
('07139000','Outras leguminosas secas'),
('07141000','Raízes de mandioca'),
('07142000','Batata-doce'),
('07149000','Outras raízes e tubérculos — inhame, cará'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 08 — FRUTAS
-- ══════════════════════════════════════════════
('08011100','Cocos secos — côco ralado'),
('08011200','Cocos frescos — côco verde'),
('08013100','Castanhas de caju'),
('08013200','Castanhas-do-pará'),
('08019000','Outros cocos e castanhas'),
('08021100','Amêndoas com casca'),
('08021200','Amêndoas sem casca'),
('08022100','Avelãs com casca'),
('08022200','Avelãs sem casca'),
('08023100','Nozes com casca'),
('08023200','Nozes sem casca'),
('08024000','Castanhas europeias (Castanea spp.)'),
('08025000','Pistaches'),
('08026000','Macadâmia'),
('08031000','Bananas do tipo plantain, frescas ou secas'),
('08039000','Outras bananas, frescas ou secas'),
('08041000','Tâmaras, frescas ou secas'),
('08042000','Figos, frescos ou secos'),
('08043000','Abacaxis (ananás), frescos ou secos'),
('08044000','Abacates, frescos ou secos'),
('08045000','Goiabas, mangas e mangostões, frescos ou secos'),
('08051000','Laranjas, frescas ou secas'),
('08052000','Tangerinas, clementinas, ponkans, frescos ou secos'),
('08054000','Toranjas e pomelos, frescos ou secos'),
('08055000','Limões, frescos ou secos'),
('08059000','Outras frutas cítricas, frescas ou secas'),
('08061000','Uvas frescas — uva de mesa'),
('08062000','Uvas passas'),
('08071100','Melancias, frescas'),
('08071900','Outros melões, frescos'),
('08072000','Mamões papaia, frescos'),
('08081000','Maçãs, frescas'),
('08082000','Peras, frescas'),
('08091000','Damascos, frescos'),
('08092000','Cerejas, frescas'),
('08093000','Pêssegos, frescos'),
('08094000','Ameixas e abrunhos, frescos'),
('08101000','Morangos, frescos'),
('08102000','Framboesas, amoras-pretas e groselhas, frescas'),
('08105000','Kiwi, fresco'),
('08108000','Pitanga, caju, jabuticaba, acerola, jaca, frescos'),
('08109000','Outras frutas frescas'),
('08111000','Morangos, congelados'),
('08112000','Framboesas, amoras e groselhas, congeladas'),
('08119000','Outras frutas congeladas'),
('08131000','Damascos, secos'),
('08132000','Ameixas, secas — ameixa preta'),
('08133000','Maçãs, secas'),
('08134000','Peras e marmelos, secos'),
('08135000','Misturas de frutas secas'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 09 — CAFÉ, CHÁ, MATE E ESPECIARIAS
-- ══════════════════════════════════════════════
('09011100','Café não torrado, não descafeinado'),
('09011200','Café não torrado, descafeinado'),
('09012100','Café torrado em grão, não descafeinado'),
('09012200','Café torrado em grão, descafeinado'),
('09012110','Café torrado e moído, não descafeinado'),
('09012210','Café torrado e moído, descafeinado'),
('09019000','Café solúvel e extratos de café — café instantâneo, cappuccino'),
('09021000','Chá verde, acondicionado — sachê de chá verde'),
('09022000','Chá verde, a granel'),
('09023000','Chá preto, a granel'),
('09024000','Chá preto e outros chás acondicionados — sachê, caixinha'),
('09030000','Erva-mate e mate'),
('09041100','Pimenta-do-reino, em grão, seca'),
('09041200','Pimenta-do-reino, triturada ou em pó'),
('09042110','Pimentas capsicum — pimenta-vermelha, malagueta, dedo-de-moça'),
('09042200','Pimentas capsicum, trituradas ou em pó — páprica, cayenne'),
('09051000','Baunilha — essência de baunilha em fava'),
('09061000','Canela, não triturada nem em pó — canela em pau'),
('09062000','Canela, triturada ou em pó'),
('09071000','Cravo-da-índia, inteiro'),
('09072000','Cravo-da-índia, triturado ou em pó'),
('09081100','Noz-moscada, inteira'),
('09081200','Noz-moscada, triturada ou em pó'),
('09091000','Sementes de anis-estrelado — badiana'),
('09092000','Sementes de coentro'),
('09093000','Sementes de cominho'),
('09096100','Sementes de funcho — erva-doce'),
('09101100','Gengibre, seco, não triturado nem em pó'),
('09101200','Gengibre, triturado ou em pó'),
('09102000','Açafrão'),
('09103000','Cúrcuma — açafrão-da-terra, turmérico'),
('09104000','Tomilho'),
('09105000','Folhas de louro'),
('09106000','Caril — curry em pó'),
('09109100','Mistura de especiarias — alho em pó, cebola em pó'),
('09109900','Outras especiarias e ervas aromáticas — orégano, manjericão, alecrim'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 10 — CEREAIS
-- ══════════════════════════════════════════════
('10011900','Trigo duro (exceto para semeadura)'),
('10019900','Outros trigos (exceto para semeadura)'),
('10040090','Aveia (exceto para semeadura)'),
('10051000','Milho para semeadura'),
('10059000','Milho (exceto para semeadura)'),
('10061000','Arroz com casca — arroz integral'),
('10062000','Arroz descascado — arroz integral descascado'),
('10063000','Arroz semibranqueado ou branqueado — arroz branco polido'),
('10064000','Arroz quebrado — quirera'),
('10086000','Quinoa — grãos de quinoa'),
('10089000','Outros cereais — amaranto, triticale'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 11 — FARINHAS, AMIDOS E FÉCULAS
-- ══════════════════════════════════════════════
('11010010','Farinha de trigo'),
('11021000','Farinha de centeio'),
('11022000','Farinha de milho — fubá mimoso, fubá de coar'),
('11023000','Farinha de arroz'),
('11029000','Farinhas de outros cereais — farinha de aveia, de cevada'),
('11031100','Sêmola de trigo'),
('11031300','Grumos e sêmola de milho — creme de milho'),
('11041200','Aveia laminada — flocos de aveia'),
('11041900','Aveia trabalhada de outros modos — farelo de aveia'),
('11042200','Milho laminado — flocos de milho'),
('11042300','Milho trabalhado de outros modos — flocão de milho'),
('11061000','Farinha e sêmola de ervilhas e feijões — farinha de grão-de-bico'),
('11062000','Farinha e sêmola de sagú ou de tubérculos — polvilho'),
('11063000','Farinha e sêmola de batata'),
('11081100','Amido de trigo'),
('11081200','Amido de milho — maisena'),
('11081300','Fécula de batata'),
('11081400','Fécula de mandioca — polvilho azedo, polvilho doce, tapioca'),
('11090000','Glúten de trigo'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 15 — GORDURAS E ÓLEOS
-- ══════════════════════════════════════════════
('15071000','Óleo de soja, em bruto'),
('15079000','Óleo de soja refinado'),
('15081000','Óleo de amendoim, em bruto'),
('15089000','Óleo de amendoim refinado'),
('15091000','Azeite de oliva virgem extra'),
('15099000','Outros azeites de oliva refinados — azeite de oliva'),
('15111000','Óleo de palma, em bruto'),
('15119000','Óleo de palma refinado'),
('15121100','Óleo de girassol, em bruto'),
('15121900','Óleo de girassol refinado'),
('15131100','Óleo de côco, em bruto'),
('15131900','Óleo de côco refinado'),
('15141100','Óleo de canola, em bruto'),
('15141900','Óleo de canola refinado'),
('15161000','Gorduras e óleos animais, hidrogenados'),
('15162000','Gorduras e óleos vegetais, hidrogenados — gordura vegetal, palma'),
('15171000','Margarina'),
('15179000','Outros compostos e misturas de gorduras vegetais — creme vegetal'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 16 — PREPARAÇÕES DE CARNES E PEIXES
-- ══════════════════════════════════════════════
('16010010','Linguiça e salsicha de carnes ou miudezas'),
('16010020','Salames, paios e presuntos cozidos'),
('16010090','Outras salsichas — mortadela, presunto cozido, apresuntado'),
('16021000','Preparações homogeneizadas de carnes — patê de frango, patê de atum'),
('16022000','Preparações e conservas de fígado'),
('16023200','Preparações de galinhas — frango temperado, nuggets, empanado'),
('16024100','Presunto de porco'),
('16024900','Outras preparações de porco — bacon fatiado, copa, lombinho defumado'),
('16025000','Preparações de bovinos — charque, carne-seca, hambúrguer bovino'),
('16029000','Outras preparações de carnes'),
('16041400','Preparações de atum — atum em conserva enlatado'),
('16041600','Preparações de anchovas'),
('16041900','Outras preparações de peixes inteiros ou em pedaços'),
('16042000','Outras preparações de peixes — bacalhau dessalgado e desfiado'),
('16052000','Camarões e gambas preparados — camarão em conserva'),
('16055400','Lulas e polvos preparados'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 17 — AÇÚCARES E CONFEITARIA
-- ══════════════════════════════════════════════
('17011400','Açúcar de cana refinado — açúcar cristal, refinado, de confeiteiro'),
('17019900','Outros açúcares de cana ou beterraba — demerara, mascavo, orgânico'),
('17021100','Lactose e xarope de lactose'),
('17023000','Glicose e xarope de glicose'),
('17025000','Frutose quimicamente pura'),
('17026000','Xarope de milho rico em frutose'),
('17029000','Outros açúcares — açúcar de côco, trealose'),
('17031000','Melaço de cana'),
('17041000','Goma de mascar, sem adição de açúcar'),
('17042000','Goma de mascar adicionada de açúcar'),
('17049010','Balas, caramelos, bombons sem cacau'),
('17049020','Drágeas e pastilhas sem cacau'),
('17049030','Pirulitos e chupas'),
('17049040','Geleias e pastas de frutas sem cacau'),
('17049090','Outros produtos de confeitaria sem cacau — marshmallow, algodão-doce'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 18 — CACAU E SEUS PREPARADOS
-- ══════════════════════════════════════════════
('18010000','Cacau inteiro ou partido, em bruto ou torrado'),
('18040000','Manteiga, gordura e óleo de cacau'),
('18050000','Cacau em pó sem adição de açúcar'),
('18061000','Cacau em pó com adição de açúcar — chocolate em pó'),
('18062000','Chocolate em blocos ou tabletes, peso > 2 kg'),
('18063100','Chocolate recheado, em tabletes ou barras, peso ≤ 2 kg'),
('18063200','Outros chocolates sem recheio, em tabletes ou barras'),
('18069010','Bombons, trufas e outros chocolates — chocolate de caixa'),
('18069020','Achocolatados em pó — Nescau, Toddy, Ovomaltine'),
('18069030','Coberturas de chocolate'),
('18069090','Outras preparações alimentícias contendo cacau'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 19 — PREPARAÇÕES À BASE DE CEREAIS
-- ══════════════════════════════════════════════
('19011000','Preparações para alimentação infantil — farinhas lácteas, papa'),
('19012000','Misturas e pastas para preparação de pão e bolos — mistura para bolo'),
('19019090','Outras preparações à base de cereais — mingau'),
('19021100','Massas alimentícias não cozidas sem ovos — macarrão, espaguete, penne'),
('19021900','Outras massas alimentícias não cozidas — com ovos'),
('19022000','Massas alimentícias recheadas — nhoque, capeletti, ravióli'),
('19023000','Outras massas alimentícias — lasanha seca, talharim, fettuccine'),
('19024000','Cuscuz — cuscuz de milho, cuscuz marroquino'),
('19030000','Tapioca e seus sucedâneos — tapioca granulada, beiju, goma de tapioca'),
('19041000','Produtos à base de cereais obtidos por expansão ou torrefação — corn flakes'),
('19042000','Preparações alimentícias de flocos de cereais — granola, muesli'),
('19043000','Bulgur — trigo para quibe'),
('19051000','Pão crocante — Knäckebrot, torrada'),
('19052000','Pão de mel, pão de especiarias'),
('19053100','Bolachas e biscoitos adicionados de edulcorante — biscoito diet'),
('19053200','Waffles e wafers — biscoito recheado, bolacha wafer'),
('19054000','Torradas — torrada fatiada, bisnaguinha torrada'),
('19059010','Pão de forma, bisnaga, pão de hambúrguer, pão de hot dog'),
('19059020','Bolos, cucas e similares — bolo de fatia, pão de mel'),
('19059030','Biscoitos doces, cream crackers, água e sal'),
('19059040','Biscoitos salgados, palitos salgados, snacks de forno'),
('19059090','Outros produtos de padaria e confeitaria — croissant, torta'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 20 — PREPARAÇÕES DE HORTALIÇAS E FRUTAS
-- ══════════════════════════════════════════════
('20011000','Pepinos para conserva em vinagre'),
('20019010','Azeitonas em vinagre'),
('20019090','Outras hortaliças e frutas em vinagre'),
('20021000','Tomates inteiros ou em pedaços, preparados'),
('20029010','Extrato de tomate — massa de tomate concentrada'),
('20029020','Molho de tomate — molho pronto, molho de pizza'),
('20029090','Outros preparados de tomate — tomate pelado, polpa de tomate'),
('20031000','Cogumelos do gênero Agaricus, preparados — cogumelo em lata'),
('20041000','Batatas preparadas, congeladas — batata palha congelada, batata frita congelada'),
('20049000','Outros hortícolas preparados, congelados'),
('20052000','Batatas preparadas, não congeladas — batata palha, batata chips'),
('20054000','Ervilhas preparadas, não congeladas — ervilha em lata'),
('20055000','Feijões preparados — feijão cozido em lata'),
('20059900','Outros hortícolas preparados — milho verde em lata, palmito em conserva'),
('20060000','Hortaliças e frutas em açúcar — frutas cristalizadas, cerejas em calda'),
('20071000','Preparações homogeneizadas de frutas — papinha industrializada'),
('20079100','Doces e geleias de frutas cítricas — doce de laranja, marmelada'),
('20079910','Doces de goiaba — goiabada, goiabada cascão'),
('20079990','Outras geleias e doces de frutas — geléia de morango, doce de leite'),
('20082000','Abacaxis preparados — abacaxi em calda'),
('20083000','Frutas cítricas preparadas — laranja em calda'),
('20085000','Damascos preparados — damasco em calda'),
('20086000','Cerejas preparadas — cereja em calda, maraschino'),
('20087000','Pêssegos preparados — pêssego em calda, pêssego em lata'),
('20089200','Misturas de frutas preparadas — salada de frutas em lata'),
('20089900','Outras frutas e partes de plantas preparadas — açaí, cupuaçu polpa'),
('20091100','Suco de laranja congelado, não fermentado — suco concentrado'),
('20091200','Suco de laranja, não congelado — suco de caixinha, néctar'),
('20093900','Outros sucos de frutas cítricas — suco de limão'),
('20094100','Suco de abacaxi — néctar de abacaxi'),
('20095000','Suco de tomate'),
('20096000','Suco de uva — suco integral de uva, suco de uva tinto'),
('20097100','Suco de maçã, não fermentado'),
('20098900','Outros sucos de frutas — suco de caju, de acerola, de goiaba, de maracujá'),
('20099000','Misturas de sucos — suco misto de frutas'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 21 — PREPARAÇÕES ALIMENTÍCIAS DIVERSAS
-- ══════════════════════════════════════════════
('21011100','Extratos e concentrados de café — café solúvel, cappuccino em pó'),
('21011200','Preparações à base de extratos de café — café 3 em 1'),
('21012000','Extratos e concentrados de chá ou mate — chá mate gelado'),
('21013000','Sucedâneos torrados do café — Cevada solúvel, cevada em grão torrado'),
('21021000','Leveduras vivas — fermento biológico fresco'),
('21022000','Leveduras mortas — fermento biológico seco'),
('21023000','Outros agentes de fermentação preparados — fermento em pó, bicarbonato'),
('21031000','Molho de soja — shoyu'),
('21032000','Ketchup e outros molhos de tomate'),
('21033000','Mostarda preparada — mostarda amarela, mostarda dijon'),
('21039000','Outros molhos e preparações — maionese, molho inglês, vinagre de maçã'),
('21041000','Preparações para caldos e sopas — caldo knorr, sazon, sopinha, creme de cebola'),
('21042000','Sopas e caldos homogeneizados — sopa em lata, creme de vegetais'),
('21050000','Sorvetes, picolés e outros gelos comestíveis'),
('21061000','Concentrados de proteínas — proteína texturizada de soja, PTS'),
('21069010','Suplementos alimentares vitamínicos — multivitamínico, vitamina C'),
('21069020','Compostos proteicos — whey protein, albumina, colágeno'),
('21069030','Temperos prontos — tempero alho e sal, chimichurri, vinagrete'),
('21069040','Bebidas em pó para reconstituição — refresco em pó, limonada em pó, caldo em pó'),
('21069050','Adoçante artificial em pó ou líquido — aspartame, sucralose, stevia, ciclamato'),
('21069060','Preparações para coberturas — granulado de chocolate, confeitos'),
('21069090','Outras preparações alimentícias — mistura de especiarias, tempero baiano'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 22 — BEBIDAS
-- ══════════════════════════════════════════════
('22011000','Água mineral natural ou artificialmente gaseificada'),
('22019000','Outras águas e gelo — água potável, gelo em cubo'),
('22021000','Água mineral com açúcar ou adoçante — água saborizada'),
('22029000','Outras bebidas não alcoólicas — refrigerante, isotônico, energético, chá gelado'),
('22030000','Cervejas de malte — cerveja, chope, cerveja artesanal, cerveja sem álcool'),
('22041000','Vinho espumante — champanhe, cava, prosecco, espumante nacional'),
('22042100','Vinho, em recipientes ≤ 2 litros — vinho de mesa em garrafa'),
('22042200','Vinho, em recipientes > 2 litros e ≤ 10 litros — bag-in-box'),
('22051000','Vermute e outros vinhos aromatizados'),
('22060000','Outras bebidas fermentadas — sidra, hidromel'),
('22071000','Álcool etílico não desnaturado, teor alcoólico ≥ 80% — álcool potável'),
('22082000','Aguardentes de vinho — conhaque, brandy, pisco'),
('22083000','Uísque — whisky, bourbon, scotch'),
('22084000','Rum e aguardentes de fermentação e destilação'),
('22085000','Gin e genebra'),
('22086000','Vodca'),
('22087000','Licores e cordiais — licor de frutas, licor de café, amaretto'),
('22088011','Cachaça industrial — aguardente de cana industrial'),
('22088012','Cachaça artesanal — cachaça de alambique'),
('22089000','Outras bebidas espirituosas — tequila, mezcal, absinto'),
('22090000','Vinagre e seus sucedâneos — vinagre de álcool, vinagre de vinho, balsâmico'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 23 — RAÇÕES E ALIMENTOS PARA ANIMAIS
-- ══════════════════════════════════════════════
('23091000','Alimentos para cães e gatos, acondicionados — ração pet seca, ração úmida'),
('23099000','Outras preparações para alimentação animal — petisco para cão, snack para gato'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 24 — TABACO
-- ══════════════════════════════════════════════
('24021000','Charutos e cigarrilhas, contendo tabaco'),
('24022000','Cigarros contendo tabaco — cigarro industrializado'),
('24031100','Tabaco para narguilé'),
('24039000','Outros tabacos — tabaco para cachimbo, fumo de rolo'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 30 — PRODUTOS FARMACÊUTICOS
-- ══════════════════════════════════════════════
('30049000','Outros medicamentos para uso humano — vitaminas, pomadas, antigripais'),
('30051000','Curativos adesivos — band-aid, esparadrapo'),
('30059000','Outros artigos com fins farmacêuticos — atadura, gaze, algodão hidrófilo'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 33 — COSMÉTICOS E HIGIENE PESSOAL
-- ══════════════════════════════════════════════
('33030000','Perfumes e águas-de-colônia'),
('33041000','Preparações para maquilagem dos lábios — batom, gloss labial'),
('33042000','Preparações para maquilagem dos olhos — rímel, delineador, sombra'),
('33043000','Preparações para manicure e pedicure — esmalte, removedor de esmalte'),
('33049100','Pós e talcos — pó de arroz, talco para bebê, pó facial'),
('33049900','Outras preparações de beleza — base, corretivo, bronzeador, BB cream'),
('33051000','Xampus — shampoo para cabelo'),
('33052000','Preparações para alisamento permanente — alisante, progressiva, relaxante'),
('33053000','Laquês para o cabelo — spray fixador, gel fixador'),
('33054000','Outras preparações capilares — condicionador, creme de pentear, óleo capilar'),
('33061000','Dentifrícios — creme dental, pasta de dente'),
('33062000','Fio dental ou fita dental'),
('33069000','Outras preparações para higiene bucal — enxaguatório, antisséptico bucal'),
('33071000','Preparações para barbear — espuma de barbear, gel de barbear'),
('33072000','Desodorantes e antiperspirantes corporais'),
('33073000','Sais perfumados e preparações para banho — sal de banho, espuma de banho'),
('33074900','Outros produtos de perfumaria e toucador — hidratante corporal, loção pós-barba'),
('33075000','Desodorizantes de ambiente — aromatizador de ambiente, odorizador de ar'),
('33079000','Outras preparações de toucador — protetor solar, repelente, autobronzeador'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 34 — SABÕES E DETERGENTES
-- ══════════════════════════════════════════════
('34011100','Sabões de toucador em barras ou pedaços — sabonete'),
('34011900','Outros sabões em barras — sabão de glicerina, sabão vegetal'),
('34012000','Sabões em outras formas — sabão em pó para roupa, flocos de sabão'),
('34013000','Produtos e preparações orgânicos tensoativos — sabão líquido de mão'),
('34021100','Alquilbenzenos sulfonados — detergente em pó concentrado'),
('34021300','Tensoativos aniônicos — detergente líquido lava-louças'),
('34022000','Preparações acondicionadas para venda a retalho — sabão líquido multiuso'),
('34029090','Outras preparações de limpeza — limpa-vidros, removedor multiuso, desengordurante'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 38 — PRODUTOS QUÍMICOS DE USO DOMÉSTICO
-- ══════════════════════════════════════════════
('38089110','Inseticidas domissanitários — mata-moscas, inseticida em aerosol'),
('38089120','Raticidas domissanitários — veneno para rato'),
('38089400','Desinfetantes — água sanitária, desinfetante de piso, álcool 70%'),
('38089900','Outros pesticidas e produtos similares — repelente elétrico, espiral anti-mosquito'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 39 — ARTIGOS DE PLÁSTICO
-- ══════════════════════════════════════════════
('39211100','Chapas e placas de polímeros de estireno expandidos — isopor'),
('39231000','Caixas e caixotes de plástico — pote de plástico com tampa'),
('39232100','Sacos e sacolas de polietileno — sacola de supermercado'),
('39232900','Outros sacos e sacolas de plástico'),
('39233000','Garrafões, garrafas e frascos de plástico — garrafa de água reutilizável'),
('39234000','Bobinas de plástico — rolo de filme plástico'),
('39241000','Serviço de mesa e cozinha de plástico — copo descartável, prato descartável'),
('39249000','Outros artigos de uso doméstico de plástico — balde, bacia, pote'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 40 — BORRACHA
-- ══════════════════════════════════════════════
('40141000','Preservativos — camisinha'),
('40151900','Luvas domésticas de borracha — luva de limpeza'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 48 — PAPEL, CARTÃO E MATERIAL ESCOLAR
-- ══════════════════════════════════════════════
('48030000','Papel higiênico — papel sanitário, papel toalha de rolo'),
('48181000','Papel higiênico — bobina de papel higiênico doméstico'),
('48182000','Lenços e lencinhos de papel — lenço de papel, lenço facial'),
('48183000','Toalhas e guardanapos de papel para uso doméstico'),
('48184000','Fraldas de papel — fralda descartável para bebê, fralda geriátrica'),
('48189000','Outros artigos de pasta de papel — absorvente higiênico, protetor de calcinha'),
('48201000','Cadernos — caderno escolar, caderno universitário, agenda'),
('48202000','Cadernos de espiral, blocos de anotações'),
('48211000','Etiquetas e rótulos de papel — etiqueta autoadesiva, rótulo'),
('48232000','Filtros de papel para coar — filtro de café'),
('48239000','Outros artigos de papel — papel manteiga, papel alumínio, papel filme plástico'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 56 — ALGODÃO E ARTIGOS HIGIÊNICOS
-- ══════════════════════════════════════════════
('56012100','Pasta de algodão — algodão hidrófilo em bola ou rolo'),
('56012200','Outros artigos de algodão — chumaço, disco de algodão desmaquiante'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 63 — ARTIGOS TÊXTEIS CONFECCIONADOS
-- ══════════════════════════════════════════════
('63079000','Outros artigos confeccionados — pano de prato, flanela de limpeza, pano de chão'),

-- ══════════════════════════════════════════════
-- CAPÍTULO 96 — OBRAS DIVERSAS
-- ══════════════════════════════════════════════
('96021000','Escovas de dente — escova dental manual, escova elétrica'),
('96039000','Vassouras, escovas e pincéis — rodo, vassourinha de banheiro, escova de roupa'),
('96081000','Canetas esferográficas'),
('96082000','Canetas e marcadores de ponta feltro — canetinha, marca-texto'),
('96089000','Outros instrumentos de escrita — lapiseira, caneta-tinteiro'),
('96092000','Giz e pastel — giz de cera, giz de quadro'),
('96170000','Garrafas térmicas e recipientes isotérmicos — garrafa térmica, marmita térmica')

ON CONFLICT (code) DO NOTHING;
