export interface EstimateSetupFormData {
  name: string;
  clientName: string;
  salesOwner: string;
  estimatedStartDate: string | null;
  projectDescription: string | null;
  smeTechnology: string | null;
  smeCreativeUX: string | null;
  smeStrategy: string | null;
  smeData: string | null;
  smeMedia: string | null;
  smeMarketingAutomation: string | null;
  smeOther: string | null;
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
}
