# Visual assets

Generated with the built-in Imagegen tool using the user-supplied screenshot as visual reference; no external generation API key used.

- `dist/assets/hero.webp` (1536px, 180KB), `hero-820.webp` (phones, 60KB), `hero.jpg` (fallback, 213KB): generated Santorini background (was a 2.4MB PNG).
- `dist/assets/mascot.webp` (400px, 27KB, alpha) used by the site; `mascot.png` (400px, 200KB) kept as a fallback: generated waving mascot (was 1254px, 1.7MB).
- Originals also retained in `../generated-assets/`.

## Background prompt

Use case: photorealistic-natural. Asset type: wide travel website hero background, landscape 3:2. Reference image is visual guidance only: recreate the sunny Mediterranean scenery behind its website UI, with NO interface. Realistic beautiful Santorini: pale blue sky and soft fluffy white clouds across top and center, turquoise sea on left, green palm fronds entering far left edge, whitewashed Santorini buildings with vivid blue domes and magenta bougainvillea clustered along far right edge. Far sea horizon with subtle distant blue coastline. Bright sunny inviting vacation light. The central 65 percent must be spacious, uncluttered pale sky and distant sea for a title and search form overlay. Buildings only at far right, palms only along left edge. Image fills frame. No people, bear, letters, words, logo, watermarks, badges, buttons, cards, forms, or any UI.

## Mascot prompt

Use case: background-extraction. Asset type: isolated 3D teddy bear mascot for travel website. Reference image: use ONLY the adorable waving bear in the lower-left blue banner as identity, clothing, expression, style and pose reference. Recreate this smiling orange-brown plush 3D teddy bear, with round ears, fuzzy golden-orange fur, large friendly glossy dark eyes, lighter cream muzzle, small dark brown nose, happy open smile. Wearing a white baseball cap with royal blue bill and piping and a simple blue airplane emblem (no lettering), white T-shirt with royal blue collar and sleeve trim (blank shirt, no lettering). One paw lifted in friendly wave toward viewer, dark brown paw pads visible; other arm relaxed. Framing: entire head, cap, arms and upper torso, bottom ending around waist, mascot centered with ample transparent margin, square canvas. Same approachable cute polished 3D advertising character style as reference. Output genuine transparent alpha background, clean fine fur silhouette edges. No background, no landscape, no speech bubble, no text, no lettering, no watermark, no other objects or characters.

## Destination photos

Downloaded from Unsplash image CDN for local reliability. These are illustrative replacement photos, not exact reference assets or supplier accommodation photos.

- Santorini: https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e
- Rome: https://images.unsplash.com/photo-1552832230-c0197dd311b5
- Maldives: https://images.unsplash.com/photo-1514282401047-d79a71a590e8
- Dubai: https://images.unsplash.com/photo-1512453979798-5ea266f8880c

Heebo is loaded from Google Fonts with Arial/system fallbacks.

## Catalog destination photos (spec 23)

One landscape photo per catalog destination, downloaded once from **Wikimedia Commons** (no hotlinking), converted locally with `cwebp` to 1200px WebP (≤ 120KB) + a 600px thumb in `dist/assets/destinations/`. Only CC0 / public-domain / CC BY / CC BY-SA files were accepted; CC BY(-SA) requires attribution, which the destination page shows under the photo (credit + licence link) and this table records. Metadata (alt, credit, licence, source) lives in `dist/catalog/images.mjs`.

| File | Source (Commons) | Author | Licence |
|---|---|---|---|
| `dist/assets/destinations/santorini.webp` (+ `-600`) | [1000 Three domes of Oia in Santorini Photo by Giles Laurent.jpg](https://commons.wikimedia.org/wiki/File:1000_Three_domes_of_Oia_in_Santorini_Photo_by_Giles_Laurent.jpg) | Giles Laurent | CC BY-SA 4.0 |
| `dist/assets/destinations/athens.webp` (+ `-600`) | [Attica 06-13 Athens 50 View from Philopappos - Acropolis Hill.jpg](https://commons.wikimedia.org/wiki/File:Attica_06-13_Athens_50_View_from_Philopappos_-_Acropolis_Hill.jpg) | A.Savin | CC BY-SA 3.0 |
| `dist/assets/destinations/crete.webp` (+ `-600`) | [Balos 1.jpg](https://commons.wikimedia.org/wiki/File:Balos_1.jpg) | Olaf Tausch | CC BY-SA 3.0 |
| `dist/assets/destinations/rhodes.webp` (+ `-600`) | [Pier at Lindos. Rhodes, Greece.jpg](https://commons.wikimedia.org/wiki/File:Pier_at_Lindos._Rhodes,_Greece.jpg) | Ввласенко | CC BY-SA 3.0 |
| `dist/assets/destinations/mykonos.webp` (+ `-600`) | [Sunset of Mykonos.jpg](https://commons.wikimedia.org/wiki/File:Sunset_of_Mykonos.jpg) | Roberto Faccenda | CC BY-SA 2.0 |
| `dist/assets/destinations/cyprus.webp` (+ `-600`) | [Roca de Afrodita, Chipre, 2021-12-10, DD 65.jpg](https://commons.wikimedia.org/wiki/File:Roca_de_Afrodita,_Chipre,_2021-12-10,_DD_65.jpg) | Diego Delso | CC BY-SA 4.0 |
| `dist/assets/destinations/rome.webp` (+ `-600`) | [Colosseum of Rome, Italy.jpg](https://commons.wikimedia.org/wiki/File:Colosseum_of_Rome,_Italy.jpg) | Wilfredor | CC0 |
| `dist/assets/destinations/milan-lake-como.webp` (+ `-600`) | [Bellagio, Lake Como, Italy (51180622244).jpg](https://commons.wikimedia.org/wiki/File:Bellagio,_Lake_Como,_Italy_(51180622244).jpg) | Ray in Manila | CC BY 2.0 |
| `dist/assets/destinations/venice.webp` (+ `-600`) | [Ponte di Rialto Venice 1.jpg](https://commons.wikimedia.org/wiki/File:Ponte_di_Rialto_Venice_1.jpg) | kallerna | CC BY-SA 4.0 |
| `dist/assets/destinations/florence-tuscany.webp` (+ `-600`) | [Panorama di Firenze centro visto dal Piazzale Michelangelo.jpg](https://commons.wikimedia.org/wiki/File:Panorama_di_Firenze_centro_visto_dal_Piazzale_Michelangelo.jpg) | PROPOLI87 | CC BY-SA 4.0 |
| `dist/assets/destinations/amalfi-naples.webp` (+ `-600`) | [Atrani (Costiera Amalfitana, 23-8-2011).jpg](https://commons.wikimedia.org/wiki/File:Atrani_(Costiera_Amalfitana,_23-8-2011).jpg) | Paolo Costa Baldi | CC BY 3.0 |
| `dist/assets/destinations/sicily.webp` (+ `-600`) | [Taormina BW 2025-04-27 09-32-30.jpg](https://commons.wikimedia.org/wiki/File:Taormina_BW_2025-04-27_09-32-30.jpg) | Berthold Werner | CC BY-SA 4.0 |
| `dist/assets/destinations/barcelona.webp` (+ `-600`) | [Sagrada Familia Barcelona 2.jpg](https://commons.wikimedia.org/wiki/File:Sagrada_Familia_Barcelona_2.jpg) | kallerna | CC BY-SA 4.0 |
| `dist/assets/destinations/madrid.webp` (+ `-600`) | [Madrid, Plaza Mayor, 2016, (02).jpg](https://commons.wikimedia.org/wiki/File:Madrid,_Plaza_Mayor,_2016,_(02).jpg) | Draceane | CC BY-SA 4.0 |
| `dist/assets/destinations/mallorca.webp` (+ `-600`) | [Rock - Cala Barques.jpg](https://commons.wikimedia.org/wiki/File:Rock_-_Cala_Barques.jpg) | H. Zell | CC BY-SA 3.0 |
| `dist/assets/destinations/tenerife.webp` (+ `-600`) | [Los Gigantes, Tenerife, España, 2012-12-16, DD 07.jpg](https://commons.wikimedia.org/wiki/File:Los_Gigantes,_Tenerife,_Espa%C3%B1a,_2012-12-16,_DD_07.jpg) | Diego Delso | CC BY-SA 3.0 |
| `dist/assets/destinations/lisbon.webp` (+ `-600`) | [Lissabon - Alfama - Largo Santa Luzia - Streetcar - 1.jpg](https://commons.wikimedia.org/wiki/File:Lissabon_-_Alfama_-_Largo_Santa_Luzia_-_Streetcar_-_1.jpg) | Ingo Mehling | CC BY-SA 4.0 |
| `dist/assets/destinations/porto.webp` (+ `-600`) | [Rabelo boats and Ribeira seen from Cais de Gaia, 20250605 1623 9879.jpg](https://commons.wikimedia.org/wiki/File:Rabelo_boats_and_Ribeira_seen_from_Cais_de_Gaia,_20250605_1623_9879.jpg) | Jakub Hałun | CC BY 4.0 |
| `dist/assets/destinations/madeira.webp` (+ `-600`) | [Ponta de São Lourenço north north east.jpg](https://commons.wikimedia.org/wiki/File:Ponta_de_S%C3%A3o_Louren%C3%A7o_north_north_east.jpg) | Richard Bartz | CC BY-SA 3.0 |
| `dist/assets/destinations/croatia.webp` (+ `-600`) | [Casco viejo de Dubrovnik, Croacia, 2014-04-14, DD 04.JPG](https://commons.wikimedia.org/wiki/File:Casco_viejo_de_Dubrovnik,_Croacia,_2014-04-14,_DD_04.JPG) | Diego Delso | CC BY-SA 3.0 |
| `dist/assets/destinations/montenegro.webp` (+ `-600`) | [20090719 Crkva Gospa od Zdravlja Kotor Bay Montenegro.jpg](https://commons.wikimedia.org/wiki/File:20090719_Crkva_Gospa_od_Zdravlja_Kotor_Bay_Montenegro.jpg) | Ggia | CC BY-SA 3.0 |
| `dist/assets/destinations/slovenia.webp` (+ `-600`) | [Bled Overview.JPG](https://commons.wikimedia.org/wiki/File:Bled_Overview.JPG) | Adiel lo | CC BY-SA 3.0 |
| `dist/assets/destinations/paris.webp` (+ `-600`) | [Eiffel Tower and Pont Alexandre III at night.jpg](https://commons.wikimedia.org/wiki/File:Eiffel_Tower_and_Pont_Alexandre_III_at_night.jpg) | Getfunky Paris | CC BY 2.0 |
| `dist/assets/destinations/nice.webp` (+ `-600`) | [Nizza-Baie des Anges-4070920.jpg](https://commons.wikimedia.org/wiki/File:Nizza-Baie_des_Anges-4070920.jpg) | Ermell | CC BY-SA 4.0 |
| `dist/assets/destinations/london.webp` (+ `-600`) | [Puente de la Torre, Londres, Inglaterra, 2014-08-11, DD 092.JPG](https://commons.wikimedia.org/wiki/File:Puente_de_la_Torre,_Londres,_Inglaterra,_2014-08-11,_DD_092.JPG) | Diego Delso | CC BY-SA 4.0 |
| `dist/assets/destinations/edinburgh.webp` (+ `-600`) | [Edinburgh Castle dec.23 (2).jpg](https://commons.wikimedia.org/wiki/File:Edinburgh_Castle_dec.23_(2).jpg) | Peulle | CC BY 4.0 |
| `dist/assets/destinations/amsterdam.webp` (+ `-600`) | [Amsterdam Canals - July 2006.jpg](https://commons.wikimedia.org/wiki/File:Amsterdam_Canals_-_July_2006.jpg) | Diliff | CC BY 2.5 |
| `dist/assets/destinations/berlin.webp` (+ `-600`) | [Brandenburg Gate - Brandenburger Tor - Berlin - Germany - 02.jpg](https://commons.wikimedia.org/wiki/File:Brandenburg_Gate_-_Brandenburger_Tor_-_Berlin_-_Germany_-_02.jpg) | Norbert Nagel | CC BY-SA 3.0 |
| `dist/assets/destinations/munich-bavaria.webp` (+ `-600`) | [Schwangau - Schloss Neuschwanstein (b).JPG](https://commons.wikimedia.org/wiki/File:Schwangau_-_Schloss_Neuschwanstein_(b).JPG) | C.Stadler/Bwag | CC BY-SA 4.0 |
| `dist/assets/destinations/prague.webp` (+ `-600`) | [North view of Charles Bridge from Mánesův most, Prague 20160808 1.jpg](https://commons.wikimedia.org/wiki/File:North_view_of_Charles_Bridge_from_M%C3%A1nes%C5%AFv_most,_Prague_20160808_1.jpg) | DXR | CC BY-SA 4.0 |
| `dist/assets/destinations/vienna.webp` (+ `-600`) | [Palacio de Schönbrunn, Viena, Austria, 2020-02-02, DD 07-09 HDR.jpg](https://commons.wikimedia.org/wiki/File:Palacio_de_Sch%C3%B6nbrunn,_Viena,_Austria,_2020-02-02,_DD_07-09_HDR.jpg) | Diego Delso | CC BY-SA 4.0 |
| `dist/assets/destinations/budapest.webp` (+ `-600`) | [Országház (Hungarian Parliament Building)(2).jpg](https://commons.wikimedia.org/wiki/File:Orsz%C3%A1gh%C3%A1z_(Hungarian_Parliament_Building)(2).jpg) | Lynx1211 | CC BY-SA 4.0 |
| `dist/assets/destinations/krakow.webp` (+ `-600`) | [Krakow - Cloth Hall from Basilica - 1.jpg](https://commons.wikimedia.org/wiki/File:Krakow_-_Cloth_Hall_from_Basilica_-_1.jpg) | Ingo Mehling | CC BY-SA 4.0 |
| `dist/assets/destinations/swiss-alps.webp` (+ `-600`) | [1 lauterbrunnen valley 2012b.jpg](https://commons.wikimedia.org/wiki/File:1_lauterbrunnen_valley_2012b.jpg) | chensiyuan | CC BY-SA 4.0 |
| `dist/assets/destinations/austrian-alps.webp` (+ `-600`) | [St Anton From Above (152128913).jpeg](https://commons.wikimedia.org/wiki/File:St_Anton_From_Above_(152128913).jpeg) | Thomas K | CC BY 3.0 |
| `dist/assets/destinations/iceland.webp` (+ `-600`) | [Skógafoss Waterfall, Iceland, 20240720 1318 2975.jpg](https://commons.wikimedia.org/wiki/File:Sk%C3%B3gafoss_Waterfall,_Iceland,_20240720_1318_2975.jpg) | Jakub Hałun | CC BY 4.0 |
| `dist/assets/destinations/norway-fjords.webp` (+ `-600`) | [Geirangerfjord from Ørnesvingen, 2013 June.jpg](https://commons.wikimedia.org/wiki/File:Geirangerfjord_from_%C3%98rnesvingen,_2013_June.jpg) | Ximonic (Simo Räsänen) | CC BY-SA 3.0 |
| `dist/assets/destinations/copenhagen.webp` (+ `-600`) | [Nyhavn, Copenhagen, 20220618 1728 7354.jpg](https://commons.wikimedia.org/wiki/File:Nyhavn,_Copenhagen,_20220618_1728_7354.jpg) | Jakub Hałun | CC BY-SA 4.0 |
| `dist/assets/destinations/istanbul.webp` (+ `-600`) | [Hagia Sophia Mars 2013.jpg](https://commons.wikimedia.org/wiki/File:Hagia_Sophia_Mars_2013.jpg) | Arild Vågen | CC BY-SA 3.0 |
| `dist/assets/destinations/georgia.webp` (+ `-600`) | [Tbilisi Old town (Vakhtang Gorgasali Square).jpg](https://commons.wikimedia.org/wiki/File:Tbilisi_Old_town_(Vakhtang_Gorgasali_Square).jpg) | Jelger Groeneveld | CC BY 2.0 |
| `dist/assets/destinations/bansko.webp` (+ `-600`) | [Bansko ski 2025 33.jpg](https://commons.wikimedia.org/wiki/File:Bansko_ski_2025_33.jpg) | kallerna | CC BY-SA 4.0 |
| `dist/assets/destinations/dubai.webp` (+ `-600`) | [Burj Khalifa from a ferry, Dubai.jpg](https://commons.wikimedia.org/wiki/File:Burj_Khalifa_from_a_ferry,_Dubai.jpg) | Jpbowen | CC BY-SA 4.0 |
| `dist/assets/destinations/abu-dhabi.webp` (+ `-600`) | [Abu Dhabi Skyline fron Corniche Rd.JPG](https://commons.wikimedia.org/wiki/File:Abu_Dhabi_Skyline_fron_Corniche_Rd.JPG) | FritzDaCat | CC BY-SA 3.0 |
| `dist/assets/destinations/eilat.webp` (+ `-600`) | [Eilat-coral-reef-reseve-d.JPG](https://commons.wikimedia.org/wiki/File:Eilat-coral-reef-reseve-d.JPG) | Mboesch | CC BY-SA 4.0 |
| `dist/assets/destinations/dead-sea.webp` (+ `-600`) | [עץ על אי מלח באמצע ים המלח.jpg](https://commons.wikimedia.org/wiki/File:%D7%A2%D7%A5_%D7%A2%D7%9C_%D7%90%D7%99_%D7%9E%D7%9C%D7%97_%D7%91%D7%90%D7%9E%D7%A6%D7%A2_%D7%99%D7%9D_%D7%94%D7%9E%D7%9C%D7%97.jpg) | ערן רזניק | CC BY-SA 4.0 |
| `dist/assets/destinations/marrakech.webp` (+ `-600`) | [Koutoubia minaret from the city.JPG](https://commons.wikimedia.org/wiki/File:Koutoubia_minaret_from_the_city.JPG) | Schorle | CC BY-SA 4.0 |
| `dist/assets/destinations/zanzibar.webp` (+ `-600`) | [White sandy beach at Nungwi, Zanzibar.jpg](https://commons.wikimedia.org/wiki/File:White_sandy_beach_at_Nungwi,_Zanzibar.jpg) | ObonyoML | CC BY-SA 4.0 |
| `dist/assets/destinations/seychelles.webp` (+ `-600`) | [Anse Source d'Argent 2-La Digue.jpg](https://commons.wikimedia.org/wiki/File:Anse_Source_d%27Argent_2-La_Digue.jpg) | Tobias Alt, Tobi 87 | CC BY-SA 4.0 |
| `dist/assets/destinations/mauritius.webp` (+ `-600`) | [Sunbathing at Le Morne Beach in Mauritius (53697787846).jpg](https://commons.wikimedia.org/wiki/File:Sunbathing_at_Le_Morne_Beach_in_Mauritius_(53697787846).jpg) | dronepicr | CC BY 2.0 |
| `dist/assets/destinations/cape-town.webp` (+ `-600`) | [Cape Town (ZA), Table Mountain -- 2024 -- 3437.jpg](https://commons.wikimedia.org/wiki/File:Cape_Town_(ZA),_Table_Mountain_--_2024_--_3437.jpg) | Dietmar Rabich | CC BY-SA 4.0 |
| `dist/assets/destinations/kenya-safari.webp` (+ `-600`) | [Three zebras in Masai Mara National Park, Kenya.jpg](https://commons.wikimedia.org/wiki/File:Three_zebras_in_Masai_Mara_National_Park,_Kenya.jpg) | Volodymyr Burdiak | CC BY-SA 4.0 |
| `dist/assets/destinations/bangkok.webp` (+ `-600`) | [Templo Wat Arun, Bangkok, Tailandia, 2013-08-22, DD 30.jpg](https://commons.wikimedia.org/wiki/File:Templo_Wat_Arun,_Bangkok,_Tailandia,_2013-08-22,_DD_30.jpg) | Diego Delso | CC BY-SA 3.0 |
| `dist/assets/destinations/phuket.webp` (+ `-600`) | [Isla Phi Phi Lay, Tailandia, 2013-08-19, DD 04.JPG](https://commons.wikimedia.org/wiki/File:Isla_Phi_Phi_Lay,_Tailandia,_2013-08-19,_DD_04.JPG) | Diego Delso | CC BY-SA 3.0 |
| `dist/assets/destinations/vietnam.webp` (+ `-600`) | [Halong Bay Island.jpg](https://commons.wikimedia.org/wiki/File:Halong_Bay_Island.jpg) | Shyamal | CC BY-SA 4.0 |
| `dist/assets/destinations/japan.webp` (+ `-600`) | [Chureito Pagoda and Mount Fuji 2023-03-07.jpg](https://commons.wikimedia.org/wiki/File:Chureito_Pagoda_and_Mount_Fuji_2023-03-07.jpg) | Stjepko Krehula | CC BY 4.0 |
| `dist/assets/destinations/bali.webp` (+ `-600`) | [Brantan Bali Pura-Ulun-Danu-Bratan-01.jpg](https://commons.wikimedia.org/wiki/File:Brantan_Bali_Pura-Ulun-Danu-Bratan-01.jpg) | CEphoto, Uwe Aranas | CC BY-SA 3.0 |
| `dist/assets/destinations/sri-lanka.webp` (+ `-600`) | [Sigiriya.jpg](https://commons.wikimedia.org/wiki/File:Sigiriya.jpg) | Bernard Gagnon | CC BY-SA 3.0 |
| `dist/assets/destinations/goa.webp` (+ `-600`) | [Anjuna Beach, Goa, India, Legendary Curlies beach shack.jpg](https://commons.wikimedia.org/wiki/File:Anjuna_Beach,_Goa,_India,_Legendary_Curlies_beach_shack.jpg) | Vyacheslav Argenberg | CC BY 4.0 |
| `dist/assets/destinations/maldives.webp` (+ `-600`) | [Diamonds Thudufushi Beach and Water Villas, May 2017 -08.jpg](https://commons.wikimedia.org/wiki/File:Diamonds_Thudufushi_Beach_and_Water_Villas,_May_2017_-08.jpg) | Martin Falbisoner | CC BY-SA 4.0 |
| `dist/assets/destinations/new-york.webp` (+ `-600`) | [Lower Manhattan from Governors Island with a fishing boat (46294p).jpg](https://commons.wikimedia.org/wiki/File:Lower_Manhattan_from_Governors_Island_with_a_fishing_boat_(46294p).jpg) | Rhododendrites | CC BY-SA 4.0 |
| `dist/assets/destinations/florida.webp` (+ `-600`) | [Miami-Florida09.JPG](https://commons.wikimedia.org/wiki/File:Miami-Florida09.JPG) | Diego Delso | CC BY 3.0 |
| `dist/assets/destinations/los-angeles.webp` (+ `-600`) | [Santa Monica Pier (June 2026).jpg](https://commons.wikimedia.org/wiki/File:Santa_Monica_Pier_(June_2026).jpg) | Busition | CC BY 4.0 |
| `dist/assets/destinations/las-vegas.webp` (+ `-600`) | [Las Vegas (Nevada, USA), The Strip -- 2012 -- 6232.jpg](https://commons.wikimedia.org/wiki/File:Las_Vegas_(Nevada,_USA),_The_Strip_--_2012_--_6232.jpg) | Dietmar Rabich | CC BY-SA 4.0 |
| `dist/assets/destinations/cancun.webp` (+ `-600`) | [Tulum - God of the Winds Temple 03.JPG](https://commons.wikimedia.org/wiki/File:Tulum_-_God_of_the_Winds_Temple_03.JPG) | Martin Falbisoner | CC BY-SA 4.0 |
| `dist/assets/destinations/costa-rica.webp` (+ `-600`) | [Arenal Volcano 02.jpg](https://commons.wikimedia.org/wiki/File:Arenal_Volcano_02.jpg) | Bernard Gagnon | CC0 |
| `dist/assets/destinations/peru.webp` (+ `-600`) | [Machu Picchu, Perú, 2015-07-30, DD 47.JPG](https://commons.wikimedia.org/wiki/File:Machu_Picchu,_Per%C3%BA,_2015-07-30,_DD_47.JPG) | Diego Delso | CC BY-SA 4.0 |
| `dist/assets/destinations/buenos-aires.webp` (+ `-600`) | [Buenos Aires - La Boca - Caminito - 200807i.jpg](https://commons.wikimedia.org/wiki/File:Buenos_Aires_-_La_Boca_-_Caminito_-_200807i.jpg) | Luis Argerich from Buenos Aires, Argentina | CC BY 2.0 |
| `dist/assets/destinations/rio.webp` (+ `-600`) | [Rio de Janeiro skyline and Sugarloaf Mountain at sunset, Brazil 3.jpg](https://commons.wikimedia.org/wiki/File:Rio_de_Janeiro_skyline_and_Sugarloaf_Mountain_at_sunset,_Brazil_3.jpg) | Wilfredor | CC0 |
| `dist/assets/destinations/sydney.webp` (+ `-600`) | [Sydneyoperahouse at night.jpg](https://commons.wikimedia.org/wiki/File:Sydneyoperahouse_at_night.jpg) | Thomas Adams | CC BY-SA 4.0 |
| `dist/assets/destinations/new-zealand.webp` (+ `-600`) | [Milford Sound in Fiordland National Park 01.jpg](https://commons.wikimedia.org/wiki/File:Milford_Sound_in_Fiordland_National_Park_01.jpg) | Krzysztof Golik | CC BY-SA 4.0 |
