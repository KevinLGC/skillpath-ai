export interface DegreeModel {
  name: string;
  nameTe: string;
  nameHi: string;
  durationYears: number;
  totalTuitionCost: number;
  booksAndCoachingCost: number;
  totalDirectExpense: number;
  year1Earnings: number;
  year2Earnings: number;
  year3Earnings: number;
  cumulativeEarnings3Yrs: number;
  net3YearPosition: number;
  placementRatePercent: number;
  avgPostCollegeJobOffer: number;
}

export interface VocationalModel {
  name: string;
  nameTe: string;
  nameHi: string;
  durationYears: number;
  totalTuitionCost: number;
  booksAndToolsCost: number;
  totalDirectExpense: number;
  year1Stipend: number;
  year2EntrySalary: number;
  year3Salary: number;
  cumulativeEarnings3Yrs: number;
  net3YearPosition: number;
  placementRatePercent: number;
  epfBenefitsAccumulated: number;
  lateralEntryDiplomaCreditsEligible: boolean;
}

export interface RoiComparisonData {
  generalDegree: DegreeModel;
  vocationalPathway: VocationalModel;
}

export const ROI_COMPARISON_DATA: RoiComparisonData = {
  generalDegree: {
    name: "General College Degree (B.A. / B.Com non-technical)",
    nameTe: "సాధారణ కాలేజీ డిగ్రీ (సాధారణ బి.ఎ / బి.కాం)",
    nameHi: "पारंपरिक कॉलेज डिग्री (साधारण बीए / बीकॉम)",
    durationYears: 3,
    totalTuitionCost: 45000,
    booksAndCoachingCost: 30000,
    totalDirectExpense: 75000,
    year1Earnings: 0,
    year2Earnings: 0,
    year3Earnings: 0,
    cumulativeEarnings3Yrs: 0,
    net3YearPosition: -75000,
    placementRatePercent: 34.2,
    avgPostCollegeJobOffer: 11000,
  },
  vocationalPathway: {
    name: "NSQF Vocational Certification + Apprenticeship (ITI / PMKK)",
    nameTe: "NSQF వృత్తి నైపుణ్య సర్టిఫికేషన్ + అప్రెంటిస్‌షిప్ (ITI / PMKK)",
    nameHi: "एनएसक्यूएफ वोकेशनल सर्टिफिकेशन + अप्रेंटिसशिप (ITI / PMKK)",
    durationYears: 3,
    totalTuitionCost: 5000, // subsidized govt ITI fee
    booksAndToolsCost: 4000,
    totalDirectExpense: 9000,
    year1Stipend: 120000, // ₹10,000/mo stipend
    year2EntrySalary: 216000, // ₹18,000/mo
    year3Salary: 408000, // ₹34,000/mo
    cumulativeEarnings3Yrs: 744000,
    net3YearPosition: 735000, // 744000 - 9000
    placementRatePercent: 88.5,
    epfBenefitsAccumulated: 89000,
    lateralEntryDiplomaCreditsEligible: true,
  },
};
