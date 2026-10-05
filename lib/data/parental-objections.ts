import type { ParentalObjectionType } from "@/lib/types";

export interface ObjectionTaxonomyItem {
  id: ParentalObjectionType;
  titleEn: string;
  titleTe: string;
  titleHi: string;
  coreFearEn: string;
  coreFearTe: string;
  coreFearHi: string;
  guidanceEn: string;
  guidanceTe: string;
  guidanceHi: string;
  keyStatistics: string;
  quickChipsEn: string[];
  quickChipsTe: string[];
  quickChipsHi: string[];
}

export const OBJECTION_TAXONOMY: ObjectionTaxonomyItem[] = [
  {
    id: "social_status",
    titleEn: 'Social Status & "Log Kya Kahenge"',
    titleTe: 'సామాజిక గౌరవం & "నలుగురూ ఏమనుకుంటారు?"',
    titleHi: 'सामाजिक प्रतिष्ठा एवं "लोग क्या कहेंगे"',
    coreFearEn: 'Fear that relatives will mock the family for choosing an ITI/vocational trade as "manual labor/mistri work" rather than a BA/BCom college.',
    coreFearTe: 'కాలేజీ డిగ్రీ బదులు ఐటీఐ లేదా వృత్తి కోర్సు చేస్తే "కూలీ పని / మెకానిక్ పని" అని బంధువులు చులకనగా చూస్తారనే భయం.',
    coreFearHi: 'डर कि रिश्तेदार ताना मारेंगे कि बेटे/बेटी को कॉलेज में बीए कराने की जगह "मिस्त्री" या "मजदूर" बना दिया।',
    guidanceEn: 'Reframe vocational trades from roadside manual labor to certified tech specialists operating automated high-voltage microgrids, robotics, and CNC controls in MNCs with official NCVT licenses.',
    guidanceTe: 'నేటి వృత్తి నైపుణ్య నిపుణులు పాతకాలం కూలీలు కాదు; వారు ఆధునిక కంపెనీలు, రోబోటిక్స్ మరియు సోలార్ గ్రిడ్లను నడిపే లైసెన్స్ కలిగిన టెక్నీషియన్లు అని వివరించండి.',
    guidanceHi: 'माता-पिता को समझाएं कि आज का वोकेशनल वर्कर मिस्त्री नहीं है, बल्कि कंप्यूटर, रोबोट और आधुनिक प्लांट संभालने वाला सरकारी NCVT लाइसेंस प्राप्त विशेषज्ञ है।',
    keyStatistics: "86% certified technicians hold formal corporate employment with identity badges, health cover, and supervisory designation by Year 3.",
    quickChipsEn: [
      "Will our family get social respect from this trade?",
      'What should we answer when relatives say it is "ordinary mechanic work"?',
      "How does society view certified NSQF technicians today?",
    ],
    quickChipsTe: [
      "ఈ కోర్సుతో సమాజంలో గౌరవం లభిస్తుందా?",
      '"ఇది సాధారణ మెకానిక్ పని" అని బంధువులు అంటే ఏమి చెప్పాలి?',
      "ప్రభుత్వ గుర్తింపు మరియు కంపెనీల్లో హోదా ఎలా ఉంటుంది?",
    ],
    quickChipsHi: [
      "क्या आईटीआई करने पर समाज में इज्जत मिलती है?",
      'रिश्तेदार कहेंगे कि मिस्त्री का काम कर रहा है, क्या जवाब दें?',
      "शादी-ब्याह और समाज में क्या इसका मान रहेगा?",
    ],
  },
  {
    id: "earning_potential",
    titleEn: "Starting Salary & 3-Year Earning Growth",
    titleTe: "ప్రారంభ జీతం & 3 ఏళ్లలో సంపాదన పెరుగుదల",
    titleHi: "कमाई, वेतन वृद्धि एवं आर्थिक सुरक्षा",
    coreFearEn: "Parents fear low starting apprentice wages and lack of pension/gratuity compared to government jobs.",
    coreFearTe: "ప్రారంభంలో జీతం తక్కువగా ఉంటుందని, ప్రభుత్వ ఉద్యోగంలా పెన్షన్ లేదా స్థిరత్వం ఉండదనే భయం.",
    coreFearHi: "डर कि शुरुआती पगार बहुत कम होगी और सरकारी नौकरी जैसी सुरक्षा या पेंशन नहीं मिलेगी।",
    guidanceEn: "Demonstrate cumulative cash flows: General BA/BCom creates 3 years of zero earnings and tuition debt, while NSQF vocational pathways earn ₹7.4L cumulative income by Year 3 with mandatory EPF and ESI healthcare.",
    guidanceTe: "సాధారణ డిగ్రీలో 3 ఏళ్లు ఖర్చు మాత్రమే ఉంటుంది, కానీ వృత్తి నైపుణ్య మార్గంలో అప్రెంటిస్‌షిప్ ద్వారా మొదటి సంవత్సరం నుంచే స్టైపెండ్ లభించి 3 ఏళ్లలో ₹7 లక్షలకు పైగా సంపాదన వస్తుందని చూపించండి.",
    guidanceHi: "डेटा दिखाएं: सामान्य बीए के 3 साल में शून्य आय और भारी खर्च होता है, जबकि वोकेशनल ट्रेड में पहले साल से वजीफा और 3 साल में ₹7 लाख+ संचयी आय व ईपीएफ (PF) मिलता है।",
    keyStatistics: "Average verified entry salary is ₹17,200/mo scaling to ₹34,500/mo by Year 3 with compulsory EPF/ESI legal cover.",
    quickChipsEn: [
      "What is the verified starting pay and 3-year growth?",
      "Do companies provide EPF provident fund and health insurance?",
      "How does 3-year vocational income compare to a college degree?",
    ],
    quickChipsTe: [
      "మొదటి జీతం ఎంత మరియు 3 ఏళ్ల తర్వాత ఎంత పెరుగుతుంది?",
      "కంపెనీలలో ఈపీఎఫ్ (PF) మరియు ఈఎస్ఐ ఆరోగ్య బీమా ఉంటాయా?",
      "సాధారణ డిగ్రీతో పోలిస్తే 3 ఏళ్లలో ఎంత పొదుపు చేయవచ్చు?",
    ],
    quickChipsHi: [
      "शुरुआत में कितनी पगार मिलेगी और 3 साल बाद कितनी होगी?",
      "क्या इसमें पीएफ (PF) और अस्पताल का बीमा (ESI) मिलता है?",
      "सामान्य बीए की तुलना में 3 साल में कितनी बचत होगी?",
    ],
  },
  {
    id: "degree_fixation",
    titleEn: "College Degree Fixation vs NEP 2020 Credit Bridge",
    titleTe: "డిగ్రీ పిచ్చి వర్సెస్ NEP 2020 క్రెడిట్ మార్గం",
    titleHi: "डिग्री की जिद बनाम राष्ट्रीय शिक्षा नीति (NEP 2020) क्रेडिट ब्रिज",
    coreFearEn: "Parents fear that vocational education creates an educational dead-end, barring students from degrees and competitive government exams.",
    coreFearTe: "ఐటీఐ చేస్తే పై చదువులు ఆగిపోతాయని, భవిష్యత్తులో డిగ్రీ లేదా ప్రభుత్వ ఉద్యోగ పరీక్షలు రాయలేరనే అపోహ.",
    coreFearHi: "डर कि आईटीआई के बाद पढ़ाई का रास्ता हमेशा के लिए बंद हो जाएगा और कभी सरकारी अफसर नहीं बन पाएंगे।",
    guidanceEn: "Clarify National Credit Framework (NCrF) under NEP 2020: NSQF Level 4 certificates grant direct lateral entry into 2nd year of Polytechnic Diploma, and UGC-recognized B.Voc degrees eligible for UPSC/State PSC exams.",
    guidanceTe: "NEP 2020 & NCrF నిబంధనల ప్రకారం NSQF లెవల్ 4 సర్టిఫికెట్ ద్వారా నేరుగా పాలిటెక్నిక్ డిప్లొమా 2వ సంవత్సరంలోకి లాటరల్ ఎంట్రీ పొందవచ్చు, అలాగే యూజీసీ గుర్తింపు పొందిన B.Voc డిగ్రీ ద్వారా ప్రభుత్వ ఉద్యోగాలకూ దరఖాస్తు చేసుకోవచ్చు.",
    guidanceHi: "एनईपी 2020 (NEP 2020) और NCrF समझाएं: छात्र सीधे पॉलिटेक्निक डिप्लोमा के द्वितीय वर्ष में लेटरल एंट्री ले सकते हैं, और बी.वॉक डिग्री लेकर सभी सरकारी प्रतियोगी परीक्षाएं दे सकते हैं।",
    keyStatistics: "100% eligibility for lateral polytechnic entry and government competitive examinations via National Credit Framework.",
    quickChipsEn: [
      "Can a student still pursue a degree or B.Voc after NSQF training?",
      "Are vocational graduates eligible for Railway, Police & Govt exams?",
      "How does NEP 2020 allow lateral entry into polytechnic diplomas?",
    ],
    quickChipsTe: [
      "ఐటీఐ తర్వాత కూడా డిగ్రీ లేదా ఇంజనీరింగ్ చేయవచ్చా?",
      "రైల్వే లేదా పోలీస్ లేదా గ్రూప్స్ ప్రభుత్వ ఉద్యోగాలకు అర్హత ఉంటుందా?",
      "నూతన విద్యా విధానం (NEP 2020) లో లాటరల్ ఎంట్రీ నియమాలు ఏమిటి?",
    ],
    quickChipsHi: [
      "क्या आईटीआई के बाद भी आगे डिग्री या बी.टेक कर सकते हैं?",
      "क्या वोकेशनल छात्र रेलवे या पुलिस की सरकारी नौकरी दे सकते हैं?",
      "एनईपी 2020 (NEP 2020) के तहत लेटरल एंट्री कैसे मिलती है?",
    ],
  },
  {
    id: "female_safety",
    titleEn: "Female Dignity, Safety & Work Environment",
    titleTe: "మహిళల గౌరవం, భద్రత & పని వాతావరణం",
    titleHi: "बेटियों की सुरक्षा, सम्मान एवं कार्य वातावरण",
    coreFearEn: "Parents of daughters worry about factory floor safety, male-dominated environments, night shifts, and harassment.",
    coreFearTe: "ఫ్యాక్టరీ లేదా సైట్లలో ఆడపిల్లలకు రక్షణ ఉంటుందా, సురక్షితమైన వాతావరణం లభిస్తుందా అనే ఆందోళన.",
    coreFearHi: "बेटियों के माता-पिता को चिंता रहती है कि कारखाने का माहौल सुरक्षित नहीं होगा या देर रात काम करना पड़ेगा।",
    guidanceEn: "Highlight statutory safety standards: mandatory POSH internal complaint committees, 24/7 CCTV, gated corporate transport, day-shift guarantees, and high female representation (30-70% in electronics, healthcare, and solar).",
    guidanceTe: "కార్పొరేట్ కంపెనీలలో POSH చట్టం కింద రక్షణ కమిటీలు, 24/7 సీసీటీవీ నిఘా, కంపెనీ బస్సు రవాణా మరియు డే షిఫ్ట్ గ్యారెంటీలు ఉంటాయని తెలియజేయండి.",
    guidanceHi: "बताएं कि आधुनिक एनएसक्यूएफ सेंटर्स में 24x7 सीसीटीवी, महिला सुरक्षा गार्ड, कंपनी की सुरक्षित बस और सख्त पॉश (POSH) समितियां मौजूद हैं।",
    keyStatistics: "Over 68% in Healthcare GDA and 74% in Apparel/Electronics assembly are female, with 100% transport adherence.",
    quickChipsEn: [
      "Is the workplace safe for female trainees and daughters?",
      "Are there safe hostels and company transport available?",
      "Which vocational trades have the highest female safety and participation?",
    ],
    quickChipsTe: [
      "ఆడపిల్లలకు శిక్షణా కేంద్రాలు మరియు కంపెనీలలో భద్రత ఎలా ఉంటుంది?",
      "హాస్టల్ మరియు పికప్-డ్రాప్ రవాణా సదుపాయాలు ఉంటాయా?",
      "ఆడపిల్లలకు అత్యంత అనుకూలమైన మరియు సురక్షితమైన ట్రేడ్‌లు ఏవి?",
    ],
    quickChipsHi: [
      "क्या बेटियों के लिए ट्रेनिंग सेंटर और कंपनी में पूरी सुरक्षा है?",
      "क्या लड़कियों के लिए हॉस्टल और आने-जाने की सुरक्षित बस मिलती है?",
      "बेटियों के लिए सबसे सुरक्षित और सम्मानजनक ट्रेड कौन से हैं?",
    ],
  },
];

export function detectParentalObjection(message: string): ParentalObjectionType {
  const m = message.toLowerCase();

  // Social status / Respect / Stigma
  if (
    m.includes("लोग क्या कहेंगे") ||
    m.includes("log kya kahenge") ||
    m.includes("इज्जत") ||
    m.includes("मिस्त्री") ||
    m.includes("mistri") ||
    m.includes("मजदूर") ||
    m.includes("सम्मान") ||
    m.includes("కూలీ") ||
    m.includes("మెకానిక్") ||
    m.includes("గౌరవం") ||
    m.includes("చులకన") ||
    m.includes("status") ||
    m.includes("respect") ||
    m.includes("relatives") ||
    m.includes("బంధువులు") ||
    m.includes("రిలేటివ్స్") ||
    m.includes("prestige") ||
    m.includes("stigma") ||
    m.includes("dignity")
  ) {
    return "social_status";
  }

  // Earnings / Salary / EPF / Benefits
  if (
    m.includes("पगार") ||
    m.includes("तनख्वाह") ||
    m.includes("कमाई") ||
    m.includes("पैसा") ||
    m.includes("वेतन") ||
    m.includes("జీతం") ||
    m.includes("సంపాదన") ||
    m.includes("డబ్బులు") ||
    m.includes("స్టైపెండ్") ||
    m.includes("salary") ||
    m.includes("wage") ||
    m.includes("earning") ||
    m.includes("stipend") ||
    m.includes("epf") ||
    m.includes("esi") ||
    m.includes("pf") ||
    m.includes("pension")
  ) {
    return "earning_potential";
  }

  // Degree fixation / Higher education / Govt exams
  if (
    m.includes("डिग्री") ||
    m.includes("कॉलेज") ||
    m.includes("बीए") ||
    m.includes("बीएससी") ||
    m.includes("सरकारी नौकरी") ||
    m.includes("డిగ్రీ") ||
    m.includes("కాలేజీ") ||
    m.includes("ప్రభుత్వ ఉద్యోగం") ||
    m.includes("degree") ||
    m.includes("college") ||
    m.includes("b.a") ||
    m.includes("b.com") ||
    m.includes("polytechnic") ||
    m.includes("b.voc") ||
    m.includes("nep 2020") ||
    m.includes("ncrf") ||
    m.includes("higher education")
  ) {
    return "degree_fixation";
  }

  // Female safety / Daughter / Environment
  if (
    m.includes("लड़की") ||
    m.includes("बेटी") ||
    m.includes("महिला") ||
    m.includes("सुरक्षा") ||
    m.includes("ఆడపిల్ల") ||
    m.includes("కూతురు") ||
    m.includes("మహిళ") ||
    m.includes("రక్షణ") ||
    m.includes("భద్రత") ||
    m.includes("వర్క్‌షాప్") ||
    m.includes("girl") ||
    m.includes("daughter") ||
    m.includes("female") ||
    m.includes("safety") ||
    m.includes("workshop") ||
    m.includes("hostel") ||
    m.includes("night shift") ||
    m.includes("posh")
  ) {
    return "female_safety";
  }

  return "general";
}
