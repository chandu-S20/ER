export type Modality = "MRI" | "CT" | "X-Ray" | "Ultrasound" | "Mammography" | "PET";
export type Insurance =
  | "Aetna"
  | "Blue Cross Blue Shield"
  | "Cigna"
  | "UnitedHealthcare"
  | "Humana"
  | "Kaiser"
  | "Medicare"
  | "Self-pay";

export interface ImagingCenter {
  id: string;
  name: string;
  address: string;
  distanceMiles: number;
  rating: number;
  reviewCount: number;
  walkInsAvailable: boolean;
  currentWaitMinutes: number | null;
  acceptsEmergency: boolean;
  modalities: Modality[];
  insurances: Insurance[];
  specialties: string[];
  estPriceRange: { min: number; max: number };
  nextAvailable: string;
  phone: string;
  /** Mock: typical hours from end of exam to report availability (for sorting). */
  avgReportTurnaroundHours: number;
  /** When true, this is an Expert Radiology–operated / preferred network site. */
  isExpertRadiologyOwned?: boolean;
}

// Mock data centered on 9952 Kika Ct (suburban Texas-ish reference point)
export const MOCK_CENTERS: ImagingCenter[] = [
  {
    id: "c1",
    name: "Northstar Imaging Center",
    address: "10210 Westpark Dr, 0.6 mi away",
    distanceMiles: 0.6,
    rating: 4.8,
    reviewCount: 412,
    walkInsAvailable: true,
    currentWaitMinutes: 15,
    acceptsEmergency: true,
    modalities: ["MRI", "CT", "X-Ray", "Ultrasound"],
    insurances: ["Aetna", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Medicare"],
    specialties: ["Sports injury", "Neuro imaging"],
    estPriceRange: { min: 380, max: 1100 },
    nextAvailable: "Today 2:30 PM",
    phone: "(713) 555-0142",
    avgReportTurnaroundHours: 18,
    isExpertRadiologyOwned: true,
  },
  {
    id: "c2",
    name: "Bayou City Radiology",
    address: "9800 Bellaire Blvd, 1.2 mi away",
    distanceMiles: 1.2,
    rating: 4.6,
    reviewCount: 287,
    walkInsAvailable: true,
    currentWaitMinutes: 35,
    acceptsEmergency: false,
    modalities: ["MRI", "CT", "X-Ray", "Mammography"],
    insurances: ["Blue Cross Blue Shield", "Cigna", "Humana", "Self-pay"],
    specialties: ["Women's imaging", "Mammography"],
    estPriceRange: { min: 320, max: 950 },
    nextAvailable: "Today 4:00 PM",
    phone: "(713) 555-0188",
    avgReportTurnaroundHours: 24,
    isExpertRadiologyOwned: true,
  },
  {
    id: "c3",
    name: "Memorial Diagnostic Partners",
    address: "9525 Katy Fwy, 1.8 mi away",
    distanceMiles: 1.8,
    rating: 4.9,
    reviewCount: 638,
    walkInsAvailable: false,
    currentWaitMinutes: null,
    acceptsEmergency: true,
    modalities: ["MRI", "CT", "PET", "X-Ray", "Ultrasound"],
    insurances: ["Aetna", "Blue Cross Blue Shield", "UnitedHealthcare", "Medicare", "Kaiser"],
    specialties: ["Oncology imaging", "Cardiac MRI"],
    estPriceRange: { min: 450, max: 2400 },
    nextAvailable: "Tomorrow 9:00 AM",
    phone: "(713) 555-0211",
    avgReportTurnaroundHours: 36,
  },
  {
    id: "c4",
    name: "Westchase Open MRI",
    address: "11050 Richmond Ave, 2.3 mi away",
    distanceMiles: 2.3,
    rating: 4.4,
    reviewCount: 196,
    walkInsAvailable: true,
    currentWaitMinutes: 50,
    acceptsEmergency: false,
    modalities: ["MRI", "X-Ray"],
    insurances: ["Cigna", "UnitedHealthcare", "Humana", "Self-pay"],
    specialties: ["Open MRI", "Claustrophobic-friendly"],
    estPriceRange: { min: 280, max: 850 },
    nextAvailable: "Today 5:15 PM",
    phone: "(713) 555-0177",
    avgReportTurnaroundHours: 20,
  },
  {
    id: "c5",
    name: "Southwest Women's Imaging",
    address: "8901 Dunvale Rd, 2.7 mi away",
    distanceMiles: 2.7,
    rating: 4.7,
    reviewCount: 521,
    walkInsAvailable: false,
    currentWaitMinutes: null,
    acceptsEmergency: false,
    modalities: ["Mammography", "Ultrasound", "MRI"],
    insurances: ["Aetna", "Blue Cross Blue Shield", "Cigna", "Medicare"],
    specialties: ["Women's health", "3D mammography"],
    estPriceRange: { min: 220, max: 780 },
    nextAvailable: "Tomorrow 10:30 AM",
    phone: "(713) 555-0299",
    avgReportTurnaroundHours: 22,
  },
  {
    id: "c6",
    name: "Galleria Advanced Imaging",
    address: "5085 Westheimer Rd, 3.1 mi away",
    distanceMiles: 3.1,
    rating: 4.5,
    reviewCount: 342,
    walkInsAvailable: true,
    currentWaitMinutes: 25,
    acceptsEmergency: true,
    modalities: ["MRI", "CT", "X-Ray", "Ultrasound", "PET"],
    insurances: ["Aetna", "UnitedHealthcare", "Humana", "Kaiser", "Self-pay"],
    specialties: ["Same-day reads", "Sports medicine"],
    estPriceRange: { min: 360, max: 1850 },
    nextAvailable: "Today 3:45 PM",
    phone: "(713) 555-0334",
    avgReportTurnaroundHours: 12,
  },
  {
    id: "c7",
    name: "Houston Heart & Vascular Imaging",
    address: "7777 Southwest Fwy, 3.6 mi away",
    distanceMiles: 3.6,
    rating: 4.8,
    reviewCount: 478,
    walkInsAvailable: false,
    currentWaitMinutes: null,
    acceptsEmergency: true,
    modalities: ["CT", "MRI", "Ultrasound"],
    insurances: ["Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Medicare"],
    specialties: ["Cardiac CT", "Vascular imaging"],
    estPriceRange: { min: 500, max: 2100 },
    nextAvailable: "Tomorrow 8:00 AM",
    phone: "(713) 555-0455",
    avgReportTurnaroundHours: 30,
  },
  {
    id: "c8",
    name: "QuickScan Walk-In Radiology",
    address: "12500 Memorial Dr, 4.2 mi away",
    distanceMiles: 4.2,
    rating: 4.2,
    reviewCount: 158,
    walkInsAvailable: true,
    currentWaitMinutes: 10,
    acceptsEmergency: false,
    modalities: ["X-Ray", "Ultrasound", "CT"],
    insurances: ["Self-pay", "Cigna", "Humana"],
    specialties: ["Walk-in only", "Same-day results"],
    estPriceRange: { min: 150, max: 650 },
    nextAvailable: "Walk in now",
    phone: "(713) 555-0566",
    avgReportTurnaroundHours: 6,
  },
  {
    id: "c9",
    name: "Texas Pediatric Imaging",
    address: "6624 Fannin St, 4.8 mi away",
    distanceMiles: 4.8,
    rating: 4.9,
    reviewCount: 289,
    walkInsAvailable: false,
    currentWaitMinutes: null,
    acceptsEmergency: true,
    modalities: ["MRI", "CT", "X-Ray", "Ultrasound"],
    insurances: ["Aetna", "Blue Cross Blue Shield", "Medicare", "UnitedHealthcare"],
    specialties: ["Pediatric imaging", "Low-dose protocols"],
    estPriceRange: { min: 400, max: 1600 },
    nextAvailable: "Tomorrow 11:00 AM",
    phone: "(713) 555-0677",
    avgReportTurnaroundHours: 20,
  },
  {
    id: "c10",
    name: "River Oaks Diagnostic Imaging",
    address: "2727 Kirby Dr, 5.4 mi away",
    distanceMiles: 5.4,
    rating: 4.6,
    reviewCount: 367,
    walkInsAvailable: true,
    currentWaitMinutes: 40,
    acceptsEmergency: false,
    modalities: ["MRI", "CT", "X-Ray", "Mammography", "Ultrasound"],
    insurances: ["Aetna", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Humana"],
    specialties: ["Concierge service", "Full body scans"],
    estPriceRange: { min: 420, max: 1950 },
    nextAvailable: "Today 6:00 PM",
    phone: "(713) 555-0788",
    avgReportTurnaroundHours: 28,
  },
];

export const ALL_INSURANCES: Insurance[] = [
  "Aetna",
  "Blue Cross Blue Shield",
  "Cigna",
  "UnitedHealthcare",
  "Humana",
  "Kaiser",
  "Medicare",
  "Self-pay",
];

export const ALL_MODALITIES: Modality[] = ["MRI", "CT", "X-Ray", "Ultrasound", "Mammography", "PET"];
