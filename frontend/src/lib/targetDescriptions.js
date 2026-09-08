export const TARGET_DETAILS = {
  "1.1": {
    goal: "Goal 1: No Poverty",
    target: "Target 1.1",
    summary: "Tracks extreme poverty eradication for people living on less than $2.15/day."
  },
  "3.1": {
    goal: "Goal 3: Good Health and Well-Being",
    target: "Target 3.1",
    summary: "Focuses on reducing maternal mortality rates during childbirth worldwide."
  },
  "13.2": {
    goal: "Goal 13: Climate Action",
    target: "Target 13.2",
    summary: "Measures greenhouse gas emissions and national climate policy integration."
  }
};

export function getTargetDetails(targetCode) {
  if (TARGET_DETAILS[targetCode]) {
    return TARGET_DETAILS[targetCode];
  }
  
  // Fallback generator for other targets
  const goalNum = targetCode ? targetCode.split('.')[0] : 'Unknown';
  return {
    goal: `Goal ${goalNum}`,
    target: `Target ${targetCode}`,
    summary: `Tracks progress and metrics for Sustainable Development Goal target ${targetCode}.`
  };
}
