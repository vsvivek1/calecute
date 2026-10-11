/**
 * Hand-picked entries for the History Clock map, first version.
 *
 * Years are integers: negative for BCE, positive for CE. `approx` marks a
 * date historians give as "circa"; a `note` says when a date is disputed.
 * An entry with no `to` is still running today. Entries are written by hand
 * from standard reference dates, not generated, and each region covers only
 * a sample of what happened there.
 *
 * `countries` are ISO 3166-1 numeric codes, matching the ids in world-atlas.
 */

export type Kind = "empire" | "monument" | "thinker" | "arts" | "event";

export type Entry = {
  kind: Kind;
  name: string;
  from: number;
  to?: number;
  approx?: boolean;
  note: string;
};

export type Region = {
  id: string;
  name: string;
  blurb: string;
  colour: string;
  countries: string[];
  /** A point region, drawn as a pin instead of country shapes: [longitude, latitude]. */
  pin?: [number, number];
  entries: Entry[];
};

export const YEAR_MIN = -3200;
export const YEAR_MAX = 2025;

export const kindLabels: Record<Kind, string> = {
  empire: "Empires & dynasties",
  monument: "Monuments",
  thinker: "Thinkers & leaders",
  arts: "Arts & literature",
  event: "Turning points",
};

export const regions: Region[] = [
  {
    id: "kerala",
    name: "Kerala",
    blurb: "A narrow coast of spice ports, temple towns and a language of its own.",
    colour: "#2f7f7a",
    countries: [],
    pin: [76.3, 10.3],
    entries: [
      { kind: "empire", name: "Early Cheras", from: -300, to: 300, approx: true, note: "Rulers praised in Tamil Sangam poetry, with a port at Muziris." },
      { kind: "empire", name: "Chera Perumals of Mahodayapuram", from: 800, to: 1124, approx: true, note: "Kings ruling from near Kodungallur. The end date is a common estimate." },
      { kind: "empire", name: "Zamorins of Calicut", from: 1200, to: 1766, approx: true, note: "Sea-trading rulers of Kozhikode, until Hyder Ali of Mysore took the city." },
      { kind: "empire", name: "Portuguese forts on the coast", from: 1498, to: 1663, note: "From Vasco da Gama's landing until the Dutch took Kochi." },
      { kind: "empire", name: "Dutch East India Company in Kerala", from: 1663, to: 1795, note: "Held Kochi until the British took it." },
      { kind: "empire", name: "Kingdom of Travancore", from: 1729, to: 1949, note: "Built up by Marthanda Varma, merged with Cochin in 1949." },
      { kind: "empire", name: "Mysore rule in Malabar", from: 1766, to: 1792, note: "Hyder Ali and Tipu Sultan, until the Treaty of Seringapatam." },
      { kind: "empire", name: "British Malabar district", from: 1792, to: 1947, note: "Northern Kerala under direct British rule." },
      { kind: "empire", name: "State of Kerala", from: 1956, note: "Formed on 1 November 1956 from Travancore-Cochin and Malabar." },
      { kind: "event", name: "Muziris trades with Rome", from: -100, to: 300, approx: true, note: "Pepper went west; Roman coins came east. Excavations at Pattanam are linked to the port." },
      { kind: "arts", name: "Sangam poetry of the Cheras", from: -300, to: 300, approx: true, note: "The Patirruppattu anthology praises Chera kings." },
      { kind: "arts", name: "Silappatikaram", from: 450, approx: true, note: "Tamil epic traditionally credited to Ilango Adigal, called a Chera prince. Its date is debated." },
      { kind: "thinker", name: "Adi Shankara", from: 788, to: 820, approx: true, note: "Advaita philosopher born at Kalady. These traditional dates are disputed." },
      { kind: "event", name: "Kollam era begins", from: 825, note: "Start of the Malayalam calendar still in use." },
      { kind: "event", name: "Tharisapalli copper plates", from: 849, note: "A grant to a Christian church at Kollam, one of the oldest dated records from Kerala." },
      { kind: "arts", name: "Koodiyattam", from: 1000, approx: true, note: "Sanskrit temple theatre, one of the oldest living theatre forms." },
      { kind: "thinker", name: "Madhava of Sangamagrama", from: 1340, to: 1425, approx: true, note: "Founder of the Kerala school of mathematics, known for infinite series." },
      { kind: "thinker", name: "Nilakantha Somayaji", from: 1501, note: "Wrote the Tantrasamgraha, an astronomy text, in 1501." },
      { kind: "event", name: "Vasco da Gama reaches Kappad", from: 1498, note: "The first sea voyage from Europe to India lands near Kozhikode." },
      { kind: "arts", name: "Thunchaththu Ezhuthachan", from: 1550, approx: true, note: "Poet called the father of modern Malayalam, author of Adhyatma Ramayanam Kilippattu." },
      { kind: "monument", name: "Mattancherry Palace", from: 1555, approx: true, note: "Built by the Portuguese for the Raja of Kochi; later renovated by the Dutch." },
      { kind: "monument", name: "Paradesi Synagogue, Kochi", from: 1568, note: "Oldest active synagogue in the Commonwealth." },
      { kind: "arts", name: "Kathakali takes shape", from: 1650, approx: true, note: "Dance-drama grown out of Ramanattam." },
      { kind: "monument", name: "Bekal Fort", from: 1650, approx: true, note: "Large coastal fort, linked to Shivappa Nayaka of Keladi." },
      { kind: "monument", name: "Sree Padmanabhaswamy Temple rebuilt", from: 1731, note: "Marthanda Varma rebuilt the Thiruvananthapuram temple." },
      { kind: "event", name: "Battle of Colachel", from: 1741, note: "Travancore defeats the Dutch East India Company." },
      { kind: "thinker", name: "Sree Narayana Guru", from: 1856, to: 1928, note: "Reformer. His Aruvippuram consecration of 1888 challenged caste rules." },
      { kind: "thinker", name: "Ayyankali", from: 1863, to: 1941, note: "Led Dalit struggles for the right to use public roads and attend school." },
      { kind: "arts", name: "Indulekha", from: 1889, note: "O. Chandu Menon's novel, often called the first Malayalam novel." },
      { kind: "event", name: "Vaikom Satyagraha", from: 1924, to: 1925, note: "Protest for the right of all castes to use the roads around Vaikom temple." },
      { kind: "arts", name: "Kerala Kalamandalam", from: 1930, note: "Arts school founded by the poet Vallathol Narayana Menon." },
      { kind: "event", name: "Temple Entry Proclamation", from: 1936, note: "Travancore opens its temples to all Hindus regardless of caste." },
      { kind: "event", name: "First elected communist government", from: 1957, note: "E. M. S. Namboodiripad becomes Chief Minister." },
    ],
  },
  {
    id: "south-asia",
    name: "Indian subcontinent",
    blurb: "River cities, great empires and a dozen living languages of literature.",
    colour: "#d9653b",
    countries: ["356", "586", "050", "524", "144", "064"],
    entries: [
      { kind: "empire", name: "Indus Valley Civilisation", from: -2600, to: -1900, approx: true, note: "Planned cities such as Harappa and Mohenjo-daro." },
      { kind: "empire", name: "Maurya Empire", from: -322, to: -185, note: "First empire to rule most of the subcontinent." },
      { kind: "empire", name: "Kushan Empire", from: 30, to: 375, approx: true, note: "Ruled the north-west and Central Asia; patrons of Gandhara art." },
      { kind: "empire", name: "Gupta Empire", from: 320, to: 550, approx: true, note: "Often called a classical age of science and Sanskrit literature." },
      { kind: "empire", name: "Imperial Cholas", from: 848, to: 1279, note: "South Indian power whose navy reached Southeast Asia." },
      { kind: "empire", name: "Delhi Sultanate", from: 1206, to: 1526, note: "Five dynasties ruling from Delhi." },
      { kind: "empire", name: "Vijayanagara Empire", from: 1336, to: 1646, note: "Capital at Hampi; lost its heartland after 1565." },
      { kind: "empire", name: "Mughal Empire", from: 1526, to: 1857, note: "From Babur's victory at Panipat to the last emperor's exile." },
      { kind: "empire", name: "Maratha Confederacy", from: 1674, to: 1818, note: "From Shivaji's coronation to defeat by the British." },
      { kind: "empire", name: "British Raj", from: 1858, to: 1947, note: "Direct Crown rule after the 1857 uprising." },
      { kind: "empire", name: "Independent India, Pakistan and neighbours", from: 1947, note: "Independence and Partition in August 1947." },
      { kind: "arts", name: "Rigveda composed", from: -1500, to: -1200, approx: true, note: "Oldest Sanskrit text, passed down orally." },
      { kind: "thinker", name: "Gautama Buddha", from: -480, approx: true, note: "Founder of Buddhism. His dates are debated by about a century." },
      { kind: "thinker", name: "Kautilya", from: -300, approx: true, note: "Statecraft text Arthashastra is attributed to him." },
      { kind: "event", name: "Kalinga War, Ashoka turns to dharma", from: -261, approx: true, note: "Ashoka's edicts were carved on rocks and pillars." },
      { kind: "monument", name: "Great Stupa at Sanchi", from: -250, approx: true, note: "Begun under Ashoka, enlarged later." },
      { kind: "arts", name: "Mahabharata and Ramayana take shape", from: -400, to: 400, approx: true, note: "Composed and expanded over several centuries." },
      { kind: "arts", name: "Kalidasa", from: 400, approx: true, note: "Sanskrit poet and playwright of Abhijnanashakuntalam." },
      { kind: "monument", name: "Ajanta cave paintings", from: 460, to: 480, approx: true, note: "Main phase of the painted Buddhist caves." },
      { kind: "thinker", name: "Aryabhata", from: 499, note: "Wrote the Aryabhatiya on mathematics and astronomy." },
      { kind: "monument", name: "Brihadisvara Temple, Thanjavur", from: 1010, approx: true, note: "Built under Rajaraja I Chola." },
      { kind: "monument", name: "Qutb Minar", from: 1199, approx: true, note: "Begun by Qutb ud-Din Aibak in Delhi." },
      { kind: "monument", name: "Konark Sun Temple", from: 1250, approx: true, note: "Built as a giant stone chariot." },
      { kind: "thinker", name: "Guru Nanak", from: 1469, to: 1539, note: "Founder of Sikhism." },
      { kind: "monument", name: "Taj Mahal", from: 1632, to: 1653, note: "Mausoleum built by Shah Jahan in Agra." },
      { kind: "event", name: "Uprising of 1857", from: 1857, note: "Ended East India Company rule." },
      { kind: "arts", name: "Tagore wins the Nobel Prize", from: 1913, note: "First non-European Nobel laureate in literature." },
      { kind: "event", name: "Salt March", from: 1930, note: "Gandhi's march to Dandi against the salt tax." },
      { kind: "thinker", name: "B. R. Ambedkar and the Constitution", from: 1950, note: "The Constitution of India takes effect on 26 January 1950." },
    ],
  },
  {
    id: "china",
    name: "China",
    blurb: "Dynasties rising and falling in a long cycle along two great rivers.",
    colour: "#b8423a",
    countries: ["156", "496", "158"],
    entries: [
      { kind: "empire", name: "Shang dynasty", from: -1600, to: -1046, approx: true, note: "Oldest dynasty known from writing, on oracle bones." },
      { kind: "empire", name: "Zhou dynasty", from: -1046, to: -256, note: "Long rule that splintered into warring states." },
      { kind: "empire", name: "Qin dynasty", from: -221, to: -206, note: "First unified empire under Qin Shi Huang." },
      { kind: "empire", name: "Han dynasty", from: -206, to: 220, note: "Gave its name to the Han Chinese." },
      { kind: "empire", name: "Sui dynasty", from: 581, to: 618, note: "Reunified China and dug the Grand Canal." },
      { kind: "empire", name: "Tang dynasty", from: 618, to: 907, note: "Cosmopolitan age of poetry and the Silk Road." },
      { kind: "empire", name: "Song dynasty", from: 960, to: 1279, note: "Printing, paper money and the compass in wide use." },
      { kind: "empire", name: "Yuan dynasty (Mongol)", from: 1271, to: 1368, note: "Founded by Kublai Khan." },
      { kind: "empire", name: "Ming dynasty", from: 1368, to: 1644, note: "Rebuilt the Great Wall and the Forbidden City." },
      { kind: "empire", name: "Qing dynasty", from: 1644, to: 1912, note: "Last imperial dynasty, of Manchu origin." },
      { kind: "empire", name: "Republic of China (mainland)", from: 1912, to: 1949, note: "Years of revolution, warlords and war." },
      { kind: "empire", name: "People's Republic of China", from: 1949, note: "Proclaimed on 1 October 1949." },
      { kind: "arts", name: "Book of Songs (Shijing)", from: -1000, to: -600, approx: true, note: "Oldest collection of Chinese poetry." },
      { kind: "thinker", name: "Confucius", from: -551, to: -479, note: "Teacher whose sayings shaped ethics and government." },
      { kind: "thinker", name: "Laozi", from: -500, approx: true, note: "Traditional author of the Daodejing. Whether he lived is debated." },
      { kind: "thinker", name: "Mencius", from: -372, to: -289, approx: true, note: "Developed Confucian teaching on human nature." },
      { kind: "monument", name: "Terracotta Army", from: -210, approx: true, note: "Buried with the First Emperor near Xi'an." },
      { kind: "event", name: "Zhang Qian's journey west", from: -138, note: "Opens Han contacts that grow into the Silk Road." },
      { kind: "event", name: "Cai Lun improves papermaking", from: 105, note: "Reported to the Han court in 105 CE." },
      { kind: "monument", name: "Mogao Caves, Dunhuang", from: 366, to: 1300, approx: true, note: "Buddhist cave shrines painted over a thousand years." },
      { kind: "arts", name: "Li Bai and Du Fu", from: 701, to: 770, note: "The two great poets of the Tang." },
      { kind: "event", name: "Diamond Sutra printed", from: 868, note: "Oldest dated printed book." },
      { kind: "thinker", name: "Zhu Xi", from: 1130, to: 1200, note: "Shaped Neo-Confucianism and the exam syllabus." },
      { kind: "event", name: "Zheng He's voyages", from: 1405, to: 1433, note: "Ming treasure fleets sail as far as East Africa." },
      { kind: "monument", name: "Forbidden City", from: 1406, to: 1420, note: "Imperial palace in Beijing." },
      { kind: "arts", name: "Dream of the Red Chamber", from: 1760, approx: true, note: "Cao Xueqin's great novel of a declining family." },
      { kind: "event", name: "First Opium War", from: 1839, to: 1842, note: "Britain forces open Chinese ports." },
    ],
  },
  {
    id: "japan",
    name: "Japan",
    blurb: "Island courts, warrior governments and a long closed peace.",
    colour: "#8a4f7d",
    countries: ["392"],
    entries: [
      { kind: "empire", name: "Jōmon period", from: -14000, to: -300, approx: true, note: "Hunter-gatherers known for some of the world's oldest pottery." },
      { kind: "empire", name: "Yayoi period", from: -300, to: 300, approx: true, note: "Rice farming and metalwork arrive." },
      { kind: "empire", name: "Kofun period", from: 300, to: 538, approx: true, note: "Named for its giant keyhole-shaped tombs." },
      { kind: "empire", name: "Asuka period", from: 538, to: 710, note: "Buddhism arrives; a central state forms." },
      { kind: "empire", name: "Nara period", from: 710, to: 794, note: "First permanent capital at Nara." },
      { kind: "empire", name: "Heian period", from: 794, to: 1185, note: "Court culture at Kyoto." },
      { kind: "empire", name: "Kamakura shogunate", from: 1185, to: 1333, note: "First warrior government." },
      { kind: "empire", name: "Muromachi (Ashikaga) shogunate", from: 1336, to: 1573, note: "Ends in a century of civil war." },
      { kind: "empire", name: "Tokugawa shogunate", from: 1603, to: 1868, note: "Two and a half centuries of peace, with limited foreign trade." },
      { kind: "empire", name: "Empire of Japan", from: 1868, to: 1947, note: "From the Meiji Restoration to the postwar constitution." },
      { kind: "empire", name: "Postwar Japan", from: 1947, note: "Constitutional monarchy and democracy." },
      { kind: "monument", name: "Daisen Kofun", from: 450, approx: true, note: "Largest keyhole tomb, linked to Emperor Nintoku." },
      { kind: "thinker", name: "Prince Shōtoku", from: 574, to: 622, note: "Credited with the Seventeen-Article Constitution of 604." },
      { kind: "monument", name: "Hōryū-ji", from: 607, approx: true, note: "Among the oldest wooden buildings in the world (rebuilt c. 700)." },
      { kind: "arts", name: "Kojiki", from: 712, note: "Oldest Japanese chronicle." },
      { kind: "monument", name: "Great Buddha of Tōdai-ji", from: 752, note: "Giant bronze Buddha at Nara." },
      { kind: "thinker", name: "Kūkai", from: 774, to: 835, note: "Founded Shingon Buddhism." },
      { kind: "arts", name: "The Tale of Genji", from: 1008, approx: true, note: "Murasaki Shikibu's novel of court life." },
      { kind: "thinker", name: "Dōgen", from: 1200, to: 1253, note: "Founded the Sōtō school of Zen." },
      { kind: "event", name: "Mongol invasions", from: 1274, to: 1281, note: "Two fleets turned back, the second by a typhoon." },
      { kind: "arts", name: "Zeami and Noh theatre", from: 1400, approx: true, note: "Zeami wrote the classic plays and treatises." },
      { kind: "event", name: "Battle of Sekigahara", from: 1600, note: "Tokugawa Ieyasu wins control of Japan." },
      { kind: "monument", name: "Himeji Castle", from: 1609, note: "Main keep completed." },
      { kind: "arts", name: "Bashō's travel haiku", from: 1689, note: "Journey of The Narrow Road to the Deep North." },
      { kind: "arts", name: "Hokusai's Great Wave", from: 1831, approx: true, note: "Woodblock print from Thirty-six Views of Mount Fuji." },
      { kind: "event", name: "Perry's ships arrive", from: 1853, note: "US pressure ends the closed-country policy." },
      { kind: "event", name: "Atomic bombings", from: 1945, note: "Hiroshima and Nagasaki, August 1945." },
    ],
  },
  {
    id: "southeast-asia",
    name: "Southeast Asia",
    blurb: "Temple kingdoms and sea empires between India and China.",
    colour: "#5f8f3e",
    countries: ["116", "764", "704", "418", "104", "360", "458"],
    entries: [
      { kind: "empire", name: "Funan", from: 100, to: 550, approx: true, note: "Early trading state in the Mekong delta." },
      { kind: "empire", name: "Srivijaya", from: 650, to: 1300, approx: true, note: "Sea power of Sumatra controlling the Malacca Strait." },
      { kind: "empire", name: "Khmer Empire", from: 802, to: 1431, note: "From Jayavarman II to the fall of Angkor." },
      { kind: "empire", name: "Pagan Kingdom", from: 849, to: 1297, note: "First kingdom to unify Myanmar." },
      { kind: "empire", name: "Đại Việt under the Lý", from: 1009, to: 1225, note: "Independent Vietnamese state at Thăng Long (Hanoi)." },
      { kind: "empire", name: "Majapahit", from: 1293, to: 1527, approx: true, note: "Javanese empire across the archipelago." },
      { kind: "empire", name: "Ayutthaya Kingdom", from: 1351, to: 1767, note: "Siamese kingdom until its capital was sacked." },
      { kind: "empire", name: "Malacca Sultanate", from: 1400, to: 1511, approx: true, note: "Port sultanate until the Portuguese conquest." },
      { kind: "empire", name: "Dutch East Indies", from: 1800, to: 1949, note: "Dutch state rule over Indonesia." },
      { kind: "empire", name: "French Indochina", from: 1887, to: 1954, note: "Vietnam, Cambodia and Laos under France." },
      { kind: "monument", name: "Borobudur", from: 825, approx: true, note: "Great Buddhist monument in Java." },
      { kind: "monument", name: "Prambanan", from: 850, approx: true, note: "Hindu temple complex near Borobudur." },
      { kind: "arts", name: "Wayang shadow puppetry", from: 1000, approx: true, note: "Javanese puppet theatre of the epics." },
      { kind: "monument", name: "Bagan temples", from: 1050, to: 1280, approx: true, note: "Thousands of temples on the plain of Bagan." },
      { kind: "monument", name: "Angkor Wat", from: 1113, to: 1150, approx: true, note: "Built under Suryavarman II." },
      { kind: "thinker", name: "Jayavarman VII", from: 1181, to: 1218, note: "Khmer king who built the Bayon and many hospitals." },
      { kind: "arts", name: "Nagarakretagama", from: 1365, note: "Javanese poem describing the Majapahit court." },
      { kind: "event", name: "Portuguese take Malacca", from: 1511, note: "Start of European control of the spice trade." },
      { kind: "arts", name: "The Tale of Kiều", from: 1820, approx: true, note: "Nguyễn Du's verse novel, Vietnam's national epic." },
      { kind: "event", name: "Indonesia and Vietnam declare independence", from: 1945, note: "Both in August–September 1945." },
    ],
  },
  {
    id: "mesopotamia-iran",
    name: "Mesopotamia & Iran",
    blurb: "Where writing began, and where empires kept rebuilding the map.",
    colour: "#c08a2c",
    countries: ["368", "364", "760", "414", "400"],
    entries: [
      { kind: "event", name: "Cuneiform writing at Uruk", from: -3200, approx: true, note: "Among the earliest writing anywhere." },
      { kind: "empire", name: "Sumerian city-states", from: -2900, to: -2350, approx: true, note: "Ur, Uruk, Lagash and their rivals." },
      { kind: "empire", name: "Akkadian Empire", from: -2334, to: -2154, approx: true, note: "Sargon of Akkad's empire." },
      { kind: "empire", name: "Old Babylonian kingdom", from: -1894, to: -1595, approx: true, note: "Hammurabi's Babylon." },
      { kind: "empire", name: "Neo-Assyrian Empire", from: -911, to: -609, note: "Military empire ruling from Nineveh." },
      { kind: "empire", name: "Neo-Babylonian Empire", from: -626, to: -539, note: "Nebuchadnezzar II's Babylon." },
      { kind: "empire", name: "Achaemenid Persian Empire", from: -550, to: -330, note: "Cyrus the Great to Alexander's conquest." },
      { kind: "empire", name: "Parthian Empire", from: -247, to: 224, note: "Rival of Rome in the east." },
      { kind: "empire", name: "Sasanian Empire", from: 224, to: 651, note: "Last pre-Islamic Persian empire." },
      { kind: "empire", name: "Abbasid Caliphate in Baghdad", from: 750, to: 1258, note: "Baghdad becomes a world centre of learning." },
      { kind: "empire", name: "Safavid Iran", from: 1501, to: 1736, note: "Made Shia Islam the state religion." },
      { kind: "empire", name: "Ottoman rule in Iraq", from: 1534, to: 1918, note: "Ended in the First World War." },
      { kind: "empire", name: "Modern Iraq and Iran", from: 1932, note: "Iraq independent from 1932; Iran a republic from 1979." },
      { kind: "arts", name: "Epic of Gilgamesh", from: -1800, approx: true, note: "Earliest versions in Old Babylonian." },
      { kind: "event", name: "Code of Hammurabi", from: -1754, approx: true, note: "Law code carved on a basalt stele." },
      { kind: "monument", name: "Ziggurat of Ur", from: -2100, approx: true, note: "Stepped temple platform built under Ur-Nammu." },
      { kind: "monument", name: "Ishtar Gate", from: -575, approx: true, note: "Blue-glazed gate of Babylon." },
      { kind: "event", name: "Cyrus Cylinder", from: -539, note: "Cyrus records his capture of Babylon." },
      { kind: "monument", name: "Persepolis", from: -518, note: "Ceremonial capital begun by Darius I." },
      { kind: "thinker", name: "Al-Khwarizmi", from: 820, approx: true, note: "Baghdad scholar whose name gave us 'algorithm'." },
      { kind: "arts", name: "Ferdowsi's Shahnameh", from: 1010, note: "Persian national epic, completed in 1010." },
      { kind: "thinker", name: "Ibn Sina (Avicenna)", from: 1025, note: "Finished the Canon of Medicine." },
      { kind: "thinker", name: "Omar Khayyam", from: 1048, to: 1131, note: "Mathematician, astronomer and poet." },
      { kind: "event", name: "Mongols sack Baghdad", from: 1258, note: "End of the Abbasid caliphate in Baghdad." },
      { kind: "arts", name: "Hafez", from: 1315, to: 1390, approx: true, note: "Persian lyric poet of Shiraz." },
      { kind: "monument", name: "Naqsh-e Jahan Square, Isfahan", from: 1598, to: 1629, note: "Shah Abbas I's new capital." },
    ],
  },
  {
    id: "egypt",
    name: "Egypt & the Nile",
    blurb: "Three thousand years of pharaohs, then Greeks, Romans, caliphs and sultans.",
    colour: "#d4a017",
    countries: ["818", "729"],
    entries: [
      { kind: "empire", name: "Early Dynastic Egypt", from: -3100, to: -2686, approx: true, note: "Upper and Lower Egypt unified." },
      { kind: "empire", name: "Old Kingdom", from: -2686, to: -2181, approx: true, note: "The age of the pyramids." },
      { kind: "empire", name: "Middle Kingdom", from: -2055, to: -1650, approx: true, note: "Reunification after a period of division." },
      { kind: "empire", name: "New Kingdom", from: -1550, to: -1069, approx: true, note: "Egypt's imperial age." },
      { kind: "empire", name: "Kingdom of Kush (Napata and Meroë)", from: -1070, to: 350, approx: true, note: "Nubian kingdom to the south; ruled Egypt as the 25th Dynasty." },
      { kind: "empire", name: "Ptolemaic Egypt", from: -305, to: -30, note: "Greek dynasty founded by Alexander's general." },
      { kind: "empire", name: "Roman and Byzantine Egypt", from: -30, to: 641, note: "Grain supplier of the Roman world." },
      { kind: "empire", name: "Fatimid Caliphate", from: 969, to: 1171, note: "Founded Cairo." },
      { kind: "empire", name: "Mamluk Sultanate", from: 1250, to: 1517, note: "Slave-soldiers who became sultans." },
      { kind: "empire", name: "Ottoman Egypt", from: 1517, to: 1798, note: "Until Napoleon's invasion." },
      { kind: "empire", name: "Muhammad Ali's dynasty", from: 1805, to: 1952, note: "Under British occupation from 1882." },
      { kind: "empire", name: "Republic of Egypt", from: 1953, note: "Declared after the 1952 revolution." },
      { kind: "monument", name: "Step Pyramid of Djoser", from: -2670, approx: true, note: "Designed by Imhotep." },
      { kind: "thinker", name: "Imhotep", from: -2650, approx: true, note: "Architect and official, later revered as a god of medicine." },
      { kind: "monument", name: "Great Pyramid of Giza", from: -2560, approx: true, note: "Built for Khufu." },
      { kind: "arts", name: "Pyramid Texts", from: -2400, approx: true, note: "Oldest religious texts, carved in royal tombs." },
      { kind: "arts", name: "Book of the Dead", from: -1550, approx: true, note: "Spells for the afterlife on papyrus." },
      { kind: "event", name: "Akhenaten's Amarna revolution", from: -1353, to: -1336, approx: true, note: "Worship centred on the sun disc Aten." },
      { kind: "monument", name: "Abu Simbel", from: -1264, approx: true, note: "Rock temples of Ramesses II." },
      { kind: "monument", name: "Library of Alexandria", from: -285, approx: true, note: "Greatest library of the ancient world." },
      { kind: "thinker", name: "Euclid", from: -300, approx: true, note: "Wrote the Elements in Alexandria." },
      { kind: "event", name: "Rosetta Stone carved", from: -196, note: "Same decree in three scripts; the key to hieroglyphs." },
      { kind: "event", name: "Death of Cleopatra VII", from: -30, note: "Egypt becomes a Roman province." },
      { kind: "thinker", name: "Hypatia", from: 355, to: 415, approx: true, note: "Mathematician and philosopher of Alexandria." },
      { kind: "monument", name: "Al-Azhar Mosque", from: 970, to: 972, note: "Home of one of the oldest universities." },
      { kind: "thinker", name: "Ibn al-Haytham", from: 1011, to: 1021, approx: true, note: "Wrote his Book of Optics in Cairo." },
      { kind: "event", name: "Suez Canal opens", from: 1869, note: "Links the Mediterranean and the Red Sea." },
      { kind: "arts", name: "Naguib Mahfouz wins the Nobel Prize", from: 1988, note: "First Arabic-language Nobel laureate in literature." },
    ],
  },
  {
    id: "mediterranean",
    name: "Greece, Italy & Anatolia",
    blurb: "City-states, Rome, Byzantium and the Ottomans around one sea.",
    colour: "#3a6ea5",
    countries: ["300", "380", "792", "196"],
    entries: [
      { kind: "empire", name: "Minoan Crete", from: -2000, to: -1450, approx: true, note: "Palace culture centred on Knossos." },
      { kind: "empire", name: "Hittite Empire", from: -1650, to: -1180, approx: true, note: "Anatolian empire, rival of Egypt." },
      { kind: "empire", name: "Mycenaean Greece", from: -1600, to: -1100, approx: true, note: "The world behind Homer's heroes." },
      { kind: "empire", name: "Roman Republic", from: -509, to: -27, note: "From the expulsion of kings to Augustus." },
      { kind: "empire", name: "Classical Greek city-states", from: -508, to: -322, approx: true, note: "Athenian democracy, Sparta and their wars." },
      { kind: "empire", name: "Alexander's empire", from: -336, to: -323, note: "Macedon to the Indus in thirteen years." },
      { kind: "empire", name: "Roman Empire (West)", from: -27, to: 476, note: "From Augustus to the last western emperor." },
      { kind: "empire", name: "Byzantine Empire", from: 330, to: 1453, note: "The eastern Roman Empire, ruled from Constantinople." },
      { kind: "empire", name: "Republic of Venice", from: 697, to: 1797, approx: true, note: "Merchant republic ended by Napoleon." },
      { kind: "empire", name: "Seljuk Sultanate of Rum", from: 1077, to: 1308, note: "Turkish state in Anatolia." },
      { kind: "empire", name: "Ottoman Empire", from: 1299, to: 1922, note: "From Osman I to the abolition of the sultanate." },
      { kind: "empire", name: "Modern Greece, Italy and Turkey", from: 1830, note: "Greece independent 1830, Italy united 1861, Turkey a republic 1923." },
      { kind: "monument", name: "Palace of Knossos", from: -1900, approx: true, note: "Largest Minoan palace." },
      { kind: "arts", name: "Homer's Iliad", from: -750, approx: true, note: "Epic of the Trojan War, written down around this time." },
      { kind: "event", name: "First recorded Olympic Games", from: -776, approx: true, note: "Traditional date." },
      { kind: "event", name: "Battle of Marathon", from: -490, note: "Athens defeats a Persian landing." },
      { kind: "thinker", name: "Socrates", from: -470, to: -399, note: "Questioner of Athens, put to death." },
      { kind: "monument", name: "Parthenon", from: -447, to: -432, note: "Temple of Athena on the Acropolis." },
      { kind: "thinker", name: "Plato", from: -428, to: -348, approx: true, note: "Founded the Academy." },
      { kind: "thinker", name: "Aristotle", from: -384, to: -322, note: "Tutor of Alexander; wrote on almost everything." },
      { kind: "thinker", name: "Archimedes", from: -287, to: -212, approx: true, note: "Mathematician and engineer of Syracuse." },
      { kind: "arts", name: "Virgil's Aeneid", from: -29, to: -19, note: "Rome's founding epic." },
      { kind: "monument", name: "Colosseum", from: 70, to: 80, note: "Amphitheatre of Rome." },
      { kind: "monument", name: "Hagia Sophia", from: 532, to: 537, note: "Justinian's great church." },
      { kind: "thinker", name: "Rumi", from: 1207, to: 1273, note: "Persian poet and mystic who lived in Konya." },
      { kind: "arts", name: "Dante's Divine Comedy", from: 1308, to: 1321, approx: true, note: "Written in Tuscan Italian." },
      { kind: "monument", name: "Brunelleschi's dome, Florence", from: 1420, to: 1436, note: "Largest brick dome ever built." },
      { kind: "event", name: "Fall of Constantinople", from: 1453, note: "Ottoman conquest ends the Byzantine Empire." },
      { kind: "arts", name: "Michelangelo's Sistine ceiling", from: 1508, to: 1512, note: "Painted for Pope Julius II." },
      { kind: "thinker", name: "Machiavelli's The Prince", from: 1513, note: "A handbook of political power." },
      { kind: "monument", name: "Süleymaniye Mosque", from: 1550, to: 1557, note: "Designed by the architect Sinan." },
      { kind: "thinker", name: "Galileo Galilei", from: 1564, to: 1642, note: "Telescope astronomy and the trial of 1633." },
    ],
  },
  {
    id: "western-europe",
    name: "Western Europe",
    blurb: "Stone circles, Rome's frontier, cathedrals, revolutions and industry.",
    colour: "#4f6d8a",
    countries: ["250", "826", "276", "724", "620", "056", "528", "756", "040", "372"],
    entries: [
      { kind: "monument", name: "Stonehenge", from: -2500, approx: true, note: "Main sarsen circle raised around this time." },
      { kind: "empire", name: "Celtic La Tène culture", from: -450, to: -50, approx: true, note: "Iron Age art and chiefdoms." },
      { kind: "empire", name: "Roman Gaul", from: -50, to: 476, note: "After Julius Caesar's conquest." },
      { kind: "empire", name: "Al-Andalus", from: 711, to: 1492, note: "Muslim rule in Iberia, ending with Granada." },
      { kind: "empire", name: "Carolingian Empire", from: 800, to: 888, note: "Charlemagne crowned emperor in 800." },
      { kind: "empire", name: "Holy Roman Empire", from: 962, to: 1806, note: "Dissolved during the Napoleonic Wars." },
      { kind: "empire", name: "Spanish overseas empire", from: 1492, to: 1898, note: "Ended with the loss of Cuba and the Philippines." },
      { kind: "empire", name: "British Empire", from: 1607, to: 1997, note: "From Jamestown to the handover of Hong Kong." },
      { kind: "empire", name: "Napoleonic Empire", from: 1804, to: 1815, note: "Ended at Waterloo." },
      { kind: "empire", name: "German Empire", from: 1871, to: 1918, note: "United under Prussia." },
      { kind: "empire", name: "European Union", from: 1993, note: "Created by the Maastricht Treaty." },
      { kind: "monument", name: "Pont du Gard", from: 50, approx: true, note: "Roman aqueduct bridge." },
      { kind: "arts", name: "Bede's Ecclesiastical History", from: 731, note: "History of the English church and people." },
      { kind: "monument", name: "Great Mosque of Córdoba", from: 785, note: "Begun under Abd al-Rahman I." },
      { kind: "event", name: "Norman Conquest of England", from: 1066, note: "William of Normandy wins at Hastings." },
      { kind: "thinker", name: "Ibn Rushd (Averroes)", from: 1126, to: 1198, note: "Córdoba philosopher and commentator on Aristotle." },
      { kind: "monument", name: "Notre-Dame de Paris", from: 1163, to: 1345, note: "Gothic cathedral." },
      { kind: "event", name: "Magna Carta", from: 1215, note: "King John agrees to limits on royal power." },
      { kind: "monument", name: "Alhambra", from: 1238, to: 1391, approx: true, note: "Nasrid palace of Granada." },
      { kind: "event", name: "Black Death", from: 1347, to: 1351, note: "Plague kills a third or more of Europe." },
      { kind: "arts", name: "Chaucer's Canterbury Tales", from: 1387, to: 1400, approx: true, note: "Stories told by pilgrims." },
      { kind: "event", name: "Gutenberg Bible printed", from: 1455, approx: true, note: "Movable-type printing in Mainz." },
      { kind: "event", name: "Luther's Ninety-five Theses", from: 1517, note: "Start of the Reformation." },
      { kind: "arts", name: "Shakespeare's plays", from: 1590, to: 1613, approx: true, note: "Written for the London stage." },
      { kind: "arts", name: "Cervantes' Don Quixote", from: 1605, note: "Often called the first modern novel." },
      { kind: "thinker", name: "Newton's Principia", from: 1687, note: "Laws of motion and gravity." },
      { kind: "event", name: "French Revolution", from: 1789, note: "Monarchy falls; rights of man declared." },
      { kind: "event", name: "Industrial Revolution", from: 1760, to: 1840, approx: true, note: "Steam, factories and railways." },
      { kind: "thinker", name: "Darwin's Origin of Species", from: 1859, note: "Evolution by natural selection." },
      { kind: "event", name: "World Wars", from: 1914, to: 1945, note: "1914–1918 and 1939–1945." },
      { kind: "event", name: "Fall of the Berlin Wall", from: 1989, note: "End of the Cold War division of Europe." },
    ],
  },
  {
    id: "west-africa",
    name: "West Africa",
    blurb: "Gold, salt and scholars along the Niger and the Sahara routes.",
    colour: "#a0522d",
    countries: ["466", "686", "324", "562", "566", "288", "854", "478", "270"],
    entries: [
      { kind: "empire", name: "Nok culture", from: -1000, to: 300, approx: true, note: "Known for terracotta sculpture. Dates are estimates." },
      { kind: "monument", name: "Djenné-Djenno", from: -250, approx: true, note: "One of the oldest known cities south of the Sahara." },
      { kind: "empire", name: "Ghana Empire (Wagadu)", from: 300, to: 1200, approx: true, note: "Grew rich on the gold trade." },
      { kind: "empire", name: "Kingdom of Benin", from: 1180, to: 1897, approx: true, note: "Ended by a British punitive expedition." },
      { kind: "empire", name: "Mali Empire", from: 1235, to: 1600, approx: true, note: "Founded by Sundiata Keita." },
      { kind: "empire", name: "Songhai Empire", from: 1464, to: 1591, note: "From Sonni Ali to the Moroccan invasion." },
      { kind: "empire", name: "Oyo Empire", from: 1600, to: 1836, approx: true, note: "Yoruba state with a strong cavalry." },
      { kind: "empire", name: "Asante Empire", from: 1701, to: 1901, note: "Akan state in present-day Ghana." },
      { kind: "empire", name: "Sokoto Caliphate", from: 1804, to: 1903, note: "Founded by Usman dan Fodio." },
      { kind: "empire", name: "Colonial rule", from: 1885, to: 1960, approx: true, note: "From the Berlin Conference to the year of independence." },
      { kind: "empire", name: "Independent West African states", from: 1957, note: "Ghana first, in 1957." },
      { kind: "arts", name: "Ife heads", from: 1200, to: 1400, approx: true, note: "Naturalistic heads cast in copper alloy." },
      { kind: "thinker", name: "Sundiata Keita", from: 1235, approx: true, note: "Hero of the Epic of Sundiata, told by griots." },
      { kind: "event", name: "Mansa Musa's pilgrimage", from: 1324, note: "His gold made Mali famous in Cairo and Europe." },
      { kind: "monument", name: "Djinguereber Mosque, Timbuktu", from: 1327, note: "Built after Mansa Musa's return." },
      { kind: "arts", name: "Timbuktu manuscripts", from: 1400, to: 1600, approx: true, note: "Libraries of law, astronomy and medicine." },
      { kind: "monument", name: "Tomb of Askia, Gao", from: 1495, approx: true, note: "Mud-brick pyramid tomb." },
      { kind: "arts", name: "Benin Bronzes", from: 1500, to: 1897, approx: true, note: "Plaques and heads made for the royal court." },
      { kind: "event", name: "Atlantic slave trade", from: 1500, to: 1867, approx: true, note: "Millions taken from the region to the Americas." },
      { kind: "thinker", name: "Ahmad Baba", from: 1556, to: 1627, note: "Scholar of Timbuktu." },
      { kind: "event", name: "Battle of Tondibi", from: 1591, note: "Moroccan guns defeat Songhai." },
      { kind: "monument", name: "Great Mosque of Djenné rebuilt", from: 1907, note: "Largest mud-brick building in the world." },
      { kind: "arts", name: "Achebe's Things Fall Apart", from: 1958, note: "Landmark Nigerian novel." },
      { kind: "arts", name: "Wole Soyinka wins the Nobel Prize", from: 1986, note: "First African Nobel laureate in literature." },
    ],
  },
  {
    id: "mesoamerica",
    name: "Mexico & Central America",
    blurb: "Pyramids, ball courts, calendars and the city on a lake.",
    colour: "#2e8b57",
    countries: ["484", "320", "084", "340", "222"],
    entries: [
      { kind: "empire", name: "Olmec civilisation", from: -1200, to: -400, approx: true, note: "Often called the mother culture of Mesoamerica." },
      { kind: "monument", name: "Olmec colossal heads", from: -1200, to: -900, approx: true, note: "Giant basalt portraits." },
      { kind: "empire", name: "Monte Albán (Zapotec)", from: -500, to: 750, approx: true, note: "Hilltop Zapotec capital in Oaxaca." },
      { kind: "empire", name: "Teotihuacan", from: -100, to: 550, approx: true, note: "One of the largest cities in the ancient world." },
      { kind: "empire", name: "Classic Maya", from: 250, to: 900, note: "Rival kingdoms such as Tikal, Calakmul and Palenque." },
      { kind: "empire", name: "Toltecs of Tula", from: 900, to: 1150, approx: true, note: "Remembered by the Aztecs as ideal ancestors." },
      { kind: "empire", name: "Aztec Triple Alliance", from: 1428, to: 1521, note: "Tenochtitlan, Texcoco and Tlacopan." },
      { kind: "empire", name: "New Spain", from: 1521, to: 1821, note: "Spanish viceroyalty." },
      { kind: "empire", name: "Independent Mexico", from: 1821, note: "After the war of independence." },
      { kind: "event", name: "Early Long Count date", from: -36, note: "Stela 2 at Chiapa de Corzo." },
      { kind: "monument", name: "Pyramid of the Sun", from: 200, approx: true, note: "Teotihuacan's largest pyramid." },
      { kind: "thinker", name: "K'inich Janaab Pakal", from: 615, to: 683, note: "King of Palenque." },
      { kind: "monument", name: "Temple of the Inscriptions, Palenque", from: 683, approx: true, note: "Pakal's funerary pyramid." },
      { kind: "monument", name: "El Castillo, Chichén Itzá", from: 900, approx: true, note: "Stepped pyramid for Kukulcán." },
      { kind: "arts", name: "Dresden Codex", from: 1225, approx: true, note: "Maya astronomical book; its date is debated." },
      { kind: "event", name: "Tenochtitlan founded", from: 1325, note: "Traditional founding date on a lake island." },
      { kind: "thinker", name: "Nezahualcoyotl", from: 1402, to: 1472, note: "Poet-king of Texcoco." },
      { kind: "event", name: "Fall of Tenochtitlan", from: 1521, note: "Taken by Cortés and his Indigenous allies." },
      { kind: "arts", name: "Popol Vuh written down", from: 1550, approx: true, note: "K'iche' Maya creation story." },
      { kind: "arts", name: "Florentine Codex", from: 1577, note: "Nahua and Spanish encyclopedia of Aztec life." },
      { kind: "thinker", name: "Sor Juana Inés de la Cruz", from: 1648, to: 1695, note: "Poet and scholar of New Spain." },
      { kind: "event", name: "Mexican Revolution", from: 1910, to: 1920, note: "Ten years of upheaval." },
      { kind: "arts", name: "Mexican muralism", from: 1922, approx: true, note: "Diego Rivera and others paint public walls." },
    ],
  },
  {
    id: "andes",
    name: "The Andes",
    blurb: "Mountain empires that ran on roads, terraces and knotted strings.",
    colour: "#9b5d2e",
    countries: ["604", "068", "218", "152"],
    entries: [
      { kind: "empire", name: "Caral-Supe (Norte Chico)", from: -3000, to: -1800, approx: true, note: "Oldest known civilisation in the Americas." },
      { kind: "monument", name: "Pyramids of Caral", from: -2600, approx: true, note: "Large platform mounds without pottery." },
      { kind: "empire", name: "Chavín culture", from: -900, to: -200, approx: true, note: "Religious centre at Chavín de Huántar." },
      { kind: "arts", name: "Paracas textiles", from: -300, to: -100, approx: true, note: "Embroidered burial mantles." },
      { kind: "monument", name: "Nazca Lines", from: -500, to: 500, approx: true, note: "Giant figures drawn on the desert." },
      { kind: "empire", name: "Moche", from: 100, to: 700, approx: true, note: "North coast culture of fine portrait pottery." },
      { kind: "monument", name: "Tomb of the Lord of Sipán", from: 250, approx: true, note: "Richly furnished Moche royal tomb." },
      { kind: "empire", name: "Tiwanaku", from: 500, to: 1000, approx: true, note: "Highland city near Lake Titicaca." },
      { kind: "empire", name: "Wari", from: 600, to: 1000, approx: true, note: "Early highland empire with roads." },
      { kind: "empire", name: "Chimú", from: 900, to: 1470, approx: true, note: "Coastal kingdom, conquered by the Inca." },
      { kind: "monument", name: "Chan Chan", from: 850, to: 1470, approx: true, note: "Chimú capital, the largest adobe city." },
      { kind: "empire", name: "Inca Empire", from: 1438, to: 1533, note: "Tawantinsuyu, from Pachacuti to the Spanish conquest." },
      { kind: "thinker", name: "Pachacuti", from: 1438, to: 1471, note: "Ruler who turned Cusco into an empire." },
      { kind: "monument", name: "Machu Picchu", from: 1450, approx: true, note: "Royal estate in the mountains." },
      { kind: "arts", name: "Quipu record-keeping", from: 1450, approx: true, note: "Knotted strings for census and tribute." },
      { kind: "event", name: "Atahualpa captured at Cajamarca", from: 1532, note: "Pizarro seizes the Inca ruler." },
      { kind: "empire", name: "Viceroyalty of Peru", from: 1542, to: 1824, note: "Spanish rule over most of South America." },
      { kind: "arts", name: "Garcilaso de la Vega's Royal Commentaries", from: 1609, note: "History of the Inca by a mestizo author." },
      { kind: "arts", name: "Cusco school of painting", from: 1650, approx: true, note: "Andean painters blending European and local styles." },
      { kind: "event", name: "Túpac Amaru II's rebellion", from: 1780, note: "Indigenous uprising against Spanish rule." },
      { kind: "event", name: "Battle of Ayacucho", from: 1824, note: "Ends Spanish rule in South America." },
    ],
  },
];

export function formatYear(year: number): string {
  if (year < 0) return `${-year} BCE`;
  return `${year} CE`;
}

export function formatSpan(entry: Entry): string {
  const c = entry.approx ? "c. " : "";
  if (entry.to === undefined && entry.kind === "empire") return `${c}${formatYear(entry.from)} – today`;
  if (entry.to === undefined || entry.to === entry.from) return `${c}${formatYear(entry.from)}`;
  if (entry.from < 0 && entry.to < 0) return `${c}${-entry.from}–${-entry.to} BCE`;
  if (entry.from > 0 && entry.to > 0) return `${c}${entry.from}–${entry.to} CE`;
  return `${c}${formatYear(entry.from)} – ${formatYear(entry.to)}`;
}

/** Empires and dynasties holding power in the given year. */
export function rulingAt(region: Region, year: number): Entry[] {
  return region.entries.filter(
    (e) => e.kind === "empire" && e.from <= year && (e.to ?? YEAR_MAX) >= year,
  );
}

/** The non-empire entries closest in time to the given year. */
export function nearestTo(region: Region, year: number, count = 6): Entry[] {
  const distance = (e: Entry) => {
    const end = e.to ?? e.from;
    if (year >= e.from && year <= end) return 0;
    return Math.min(Math.abs(year - e.from), Math.abs(year - end));
  };
  return region.entries
    .filter((e) => e.kind !== "empire")
    .map((e) => ({ e, d: distance(e) }))
    .sort((a, b) => a.d - b.d || a.e.from - b.e.from)
    .slice(0, count)
    .map(({ e }) => e)
    .sort((a, b) => a.from - b.from);
}

/** Empires that rose or broke within `window` years of the given year. */
export function risesAndFalls(region: Region, year: number, window = 100) {
  const out: { entry: Entry; what: "rises" | "falls"; at: number }[] = [];
  for (const e of region.entries) {
    if (e.kind !== "empire") continue;
    if (Math.abs(e.from - year) <= window) out.push({ entry: e, what: "rises", at: e.from });
    if (e.to !== undefined && Math.abs(e.to - year) <= window) out.push({ entry: e, what: "falls", at: e.to });
  }
  return out.sort((a, b) => a.at - b.at);
}
