interface QARatios {
  ratioQAToDev: number
  ratioTestCaseAuthoring: number
  ratioDefectFixing: number
  ratioAlphaTesting: number
  ratioUAT: number
}

interface QAFoundationHours {
  qaToDev: number
  testCaseAuthoring: number
  defectFixing: number
  alphaTesting: number
  uat: number
  total: number
}

export function calculateQAFoundationHours(
  testableStoryMeanHours: number,
  ratios: QARatios
): QAFoundationHours {
  const qaToDev = testableStoryMeanHours * ratios.ratioQAToDev
  const testCaseAuthoring = testableStoryMeanHours * ratios.ratioTestCaseAuthoring
  const defectFixing = testableStoryMeanHours * ratios.ratioDefectFixing
  const alphaTesting = testableStoryMeanHours * ratios.ratioAlphaTesting
  const uat = testableStoryMeanHours * ratios.ratioUAT
  return { qaToDev, testCaseAuthoring, defectFixing, alphaTesting, uat, total: qaToDev + testCaseAuthoring + defectFixing + alphaTesting + uat }
}
