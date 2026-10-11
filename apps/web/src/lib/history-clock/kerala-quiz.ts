/**
 * Kerala history quiz. Each round draws ten questions from this pool. The
 * first option is the correct one; the quiz shuffles the options before
 * showing them. Keep the facts in step with the Kerala entries in regions.ts.
 */
export type Question = {
  q: string;
  options: [string, string, string, string];
  why: string;
};

export const ROUND_SIZE = 10;

export const keralaQuestions: Question[] = [
  {
    q: "Which ancient Kerala port traded pepper with the Roman world?",
    options: ["Muziris", "Calicut", "Quilon", "Cannanore"],
    why: "Muziris, near today's Kodungallur, appears in Roman and Tamil sources. Excavations at Pattanam are linked to it.",
  },
  {
    q: "In which year did Vasco da Gama land at Kappad, near Kozhikode?",
    options: ["1498", "1492", "1510", "1453"],
    why: "His fleet reached the Malabar coast in May 1498, the first sea voyage from Europe to India.",
  },
  {
    q: "On what date was the state of Kerala formed?",
    options: ["1 November 1956", "15 August 1947", "26 January 1950", "1 July 1949"],
    why: "Kerala was formed on 1 November 1956. 1 July 1949 is when Travancore and Cochin merged.",
  },
  {
    q: "Which philosopher of Advaita Vedanta is traditionally said to have been born at Kalady?",
    options: ["Adi Shankara", "Ramanuja", "Madhvacharya", "Basava"],
    why: "Tradition places Adi Shankara's birth at Kalady on the Periyar. His exact dates are debated.",
  },
  {
    q: "Who founded the Kerala school of mathematics, known for infinite series for pi and sine?",
    options: ["Madhava of Sangamagrama", "Aryabhata", "Bhaskara II", "Brahmagupta"],
    why: "Madhava (c. 1340–1425) and his followers, such as Nilakantha Somayaji, worked out these series centuries before Europe.",
  },
  {
    q: "Which ruler built up Travancore and defeated the Dutch at Colachel in 1741?",
    options: ["Marthanda Varma", "Swathi Thirunal", "Sakthan Thampuran", "Pazhassi Raja"],
    why: "Marthanda Varma's victory at Colachel ended Dutch ambitions in Travancore.",
  },
  {
    q: "What title did the rulers of Kozhikode (Calicut) hold?",
    options: ["Zamorin (Samoothiri)", "Perumal", "Nizam", "Peshwa"],
    why: "The Zamorins ruled Kozhikode as a sea-trading kingdom until Hyder Ali took the city in 1766.",
  },
  {
    q: "Which reformer consecrated a Shiva idol at Aruvippuram in 1888?",
    options: ["Sree Narayana Guru", "Chattampi Swamikal", "Ayyankali", "Vakkom Moulavi"],
    why: "The Aruvippuram consecration challenged the rule that only Brahmins could install temple idols.",
  },
  {
    q: "What was the Vaikom Satyagraha of 1924–25 about?",
    options: [
      "The right of all castes to use the roads around Vaikom temple",
      "The tax on salt",
      "Land reform for tenant farmers",
      "Votes for women",
    ],
    why: "The protest at Vaikom targeted the ban on lower castes using the public roads near the temple.",
  },
  {
    q: "Who wrote Indulekha (1889), often called the first Malayalam novel?",
    options: ["O. Chandu Menon", "C. V. Raman Pillai", "Kumaran Asan", "Vaikom Muhammad Basheer"],
    why: "O. Chandu Menon wrote Indulekha. C. V. Raman Pillai's Marthandavarma followed in 1891.",
  },
  {
    q: "Which poet founded Kerala Kalamandalam in 1930?",
    options: ["Vallathol Narayana Menon", "Kumaran Asan", "Ulloor S. Parameswara Iyer", "G. Sankara Kurup"],
    why: "Vallathol founded Kalamandalam to revive Kathakali and other Kerala arts.",
  },
  {
    q: "In which year does the Kollam era (the Malayalam calendar) begin?",
    options: ["825 CE", "1000 CE", "500 CE", "1124 CE"],
    why: "The Kollam era, or Kolla Varsham, counts from 825 CE.",
  },
  {
    q: "Who rode a bullock cart along a road barred to Dalits in 1893 to claim the right to use it?",
    options: ["Ayyankali", "Sree Narayana Guru", "Pandit K. P. Karuppan", "Poikayil Appachan"],
    why: "Ayyankali's villuvandi journey became a symbol of the struggle for access to public roads.",
  },
  {
    q: "Who led Kerala's first elected government in 1957?",
    options: ["E. M. S. Namboodiripad", "Pattom Thanu Pillai", "C. Achutha Menon", "R. Sankar"],
    why: "E. M. S. Namboodiripad headed one of the first elected communist governments in the world.",
  },
  {
    q: "When was the Paradesi Synagogue in Kochi built?",
    options: ["1568", "1498", "1663", "1795"],
    why: "Built in 1568, it is the oldest active synagogue in the Commonwealth.",
  },
  {
    q: "Which European power took Kochi from the Portuguese in 1663?",
    options: ["The Dutch", "The British", "The French", "The Danes"],
    why: "The Dutch East India Company held Kochi from 1663 until the British took it in 1795.",
  },
  {
    q: "Which Travancore ruler issued the Temple Entry Proclamation of 1936?",
    options: ["Chithira Thirunal Balarama Varma", "Swathi Thirunal", "Marthanda Varma", "Ayilyam Thirunal"],
    why: "The proclamation opened Travancore's state temples to all Hindus regardless of caste.",
  },
  {
    q: "Thunchaththu Ezhuthachan, called the father of modern Malayalam, wrote which work?",
    options: ["Adhyatma Ramayanam Kilippattu", "Krishnagatha", "Indulekha", "Silappatikaram"],
    why: "His Kilippattu retelling of the Ramayana is still read aloud in Kerala homes in the month of Karkidakam.",
  },
  {
    q: "Mysore's rule over Malabar ended with which treaty in 1792?",
    options: ["Treaty of Seringapatam", "Treaty of Mangalore", "Treaty of Salbai", "Treaty of Madras"],
    why: "Tipu Sultan ceded Malabar to the British East India Company at Seringapatam.",
  },
  {
    q: "Which surviving form of Sanskrit theatre from Kerala is among the oldest living theatre traditions?",
    options: ["Koodiyattam", "Ottamthullal", "Theyyam", "Oppana"],
    why: "Koodiyattam, performed in temple theatres called koothambalams, was among the first forms UNESCO recognised in 2001.",
  },
];

export function rankFor(score: number, total: number): { title: string; line: string } {
  const share = score / total;
  if (share >= 0.9) return { title: "Royal historian of the Zamorin", line: "The court would hire you on the spot." };
  if (share >= 0.7) return { title: "Court chronicler", line: "Your palm-leaf records are in very good order." };
  if (share >= 0.4) return { title: "Temple-town storyteller", line: "Good stories, a few dates wandering off." };
  return { title: "Apprentice scribe", line: "Every chronicler starts somewhere. Spin the clock and try again." };
}
