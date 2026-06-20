export interface Client {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface SmeEntry {
  id: string;
  name: string;
  domain: string | null;
  order: number;
}

export interface EstimateSetupFormData {
  name: string;
  clientName: string;
  clientId: string | null;
  projectId: string | null;
  salesOwner: string;
  salesOriginator: string | null;
  estimatedStartDate: string | null;
  projectDescription: string | null;
  smes: SmeEntry[];
  ratioQAToDev: number;
  ratioTestCaseAuthoring: number;
  ratioDefectFixing: number;
  ratioAlphaTesting: number;
  ratioUAT: number;
  riskPremiumPct: number;
  version: number;
}

export interface EstimateSetupFormProps {
  estimateId: string;
  initialData: EstimateSetupFormData;
  clients: Client[];
  initialProjects: Project[];
}
