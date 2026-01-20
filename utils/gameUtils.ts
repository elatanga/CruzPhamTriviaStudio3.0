
import { Category, GameSettings, Question, Template } from "../types";

export const calculateGridMetrics = (rowCount: number) => {
  // Enforce rigid 100-point increment structure
  const targetMax = 1000;
  const safeRows = Math.max(1, Math.min(10, rowCount));
  
  // Calculate the largest 100-increment step that fits within targetMax for the given rows
  // e.g. 4 rows: 1000 / 4 = 250. Floor to 100s = 200.
  // This ensures we never get 166, 250, 333 etc.
  let step = Math.floor((targetMax / safeRows) / 100) * 100;
  
  // Minimum step fallback
  if (step < 100) step = 100;

  const maxPoints = step * safeRows;
  
  return {
    minPoints: step,
    maxPoints: maxPoints,
    step: step
  };
};

export const generateEmptyCategory = (id: string, settings: GameSettings): Category => {
  const questions: Question[] = [];
  // Loop through points based on settings
  for (let p = settings.minPoints; p <= settings.maxPoints; p += settings.step) {
    questions.push({
      id: `${id}-${p}`,
      categoryId: id,
      points: p,
      prompt: "Enter Question Prompt...",
      answer: "Enter Answer...",
      status: 'available'
    });
  }
  
  return {
    id,
    title: "NEW CATEGORY",
    questions
  };
};

export const createNewTemplate = (ownerId: string, name: string = "Untitled Production", rowCount: number = 5): Template => {
  const { minPoints, maxPoints, step } = calculateGridMetrics(rowCount);

  const settings: GameSettings = {
    minPoints,
    maxPoints,
    step,
    currencySymbol: '$',
    timerDuration: 30
  };

  const categories: Category[] = [];
  for(let i=0; i<6; i++) {
    // Adding random suffix to ensure uniqueness even if called rapidly
    const uniqueSuffix = Math.random().toString(36).substr(2, 5);
    categories.push(generateEmptyCategory(`cat-${Date.now()}-${i}-${uniqueSuffix}`, settings));
  }

  return {
    id: `tpl-${Date.now()}`,
    ownerId,
    name,
    settings,
    categories,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    updatedBy: ownerId
  };
};

export const rebalanceQuestions = (categories: Category[], newSettings: GameSettings): Category[] => {
  return categories.map(cat => {
    const newQuestions: Question[] = [];
    let existingIndex = 0;

    for (let p = newSettings.minPoints; p <= newSettings.maxPoints; p += newSettings.step) {
      // Try to preserve existing content if available
      if (existingIndex < cat.questions.length) {
        newQuestions.push({
          ...cat.questions[existingIndex],
          points: p, // Update point value to match new slot
          id: `${cat.id}-${p}`, // Update ID to match point
          categoryId: cat.id
        });
        existingIndex++;
      } else {
        // Create new empty question
        newQuestions.push({
          id: `${cat.id}-${p}`,
          categoryId: cat.id,
          points: p,
          prompt: "Enter Question Prompt...",
          answer: "Enter Answer...",
          status: 'available'
        });
      }
    }
    return { ...cat, questions: newQuestions };
  });
};

export const exportTemplateToJSON = (template: Template) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `CruzPham_${template.name.replace(/\s+/g, '_')}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
