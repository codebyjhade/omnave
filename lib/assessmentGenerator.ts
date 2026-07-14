export interface GeneratedQuestion {
  index: number;
  type: "multiple-choice" | "true-false" | "identification" | "fill-blank" | "matching" | "short-answer";
  question: string;
  options?: string[]; // For MC
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "moderate" | "hard";
  subjectCategory: string;
  matchingPairs?: { term: string; definition: string }[]; // For matching
}

export function generateAssessment(
  baseQuizzes: any[],
  summaryText: string,
  mode: "quiz" | "practice" | "mock",
  count: number,
  difficulty: "easy" | "moderate" | "hard" | "mixed",
  types: string[],
  blueprint: string,
  customPercentages?: Record<string, number>
): GeneratedQuestion[] {
  const concepts: { term: string; desc: string }[] = [];
  const lines = summaryText.split("\n");
  
  lines.forEach((line) => {
    const match = line.match(/(?:-\s+\*\*|\#\#\#\s+)([^:]+):\*\*\s+(.+)/) || line.match(/(?:-\s+\*\*|\#\#\#\s+)([^:]+):\s+(.+)/);
    if (match && match[1] && match[2]) {
      const term = match[1].replace(/\*\*/g, "").trim();
      const desc = match[2].trim();
      if (term.length > 2 && desc.length > 10) {
        concepts.push({ term, desc });
      }
    }
  });

  if (concepts.length < 5) {
    concepts.push(
      { term: "Active Recall", desc: "A learning principle that involves testing your memory during learning to build neural links." },
      { term: "Spaced Repetition", desc: "A method of reviewing study materials at increasing intervals to move facts into long-term storage." },
      { term: "Cognitive Load", desc: "The total amount of mental energy being used in the working memory." },
      { term: "Leitner System", desc: "A flashcard review schedule method that uses card boxes sorting cards by confidence levels." },
      { term: "Feynman Technique", desc: "A study tactic of explaining a topic in simple terms as if teaching a beginner." }
    );
  }

  let targetTypes = [...types];
  if (targetTypes.length === 0) {
    targetTypes = ["multiple-choice", "true-false", "identification"];
  }

  if (blueprint === "quiz") {
    targetTypes = ["multiple-choice", "true-false"];
  } else if (blueprint === "board") {
    targetTypes = ["multiple-choice"];
  } else if (blueprint === "school") {
    targetTypes = ["multiple-choice", "true-false", "identification", "fill-blank"];
  } else if (blueprint === "review") {
    targetTypes = ["multiple-choice", "true-false", "identification", "fill-blank", "matching", "short-answer"];
  }

  const generatedList: GeneratedQuestion[] = [];

  let index = 1;
  const baseMcQuestions = Array.isArray(baseQuizzes) ? baseQuizzes : [];
  
  baseMcQuestions.forEach((q) => {
    if (index > count) return;
    
    const options = [
      q.option_a || q.options?.[0] || "Option A",
      q.option_b || q.options?.[1] || "Option B",
      q.option_c || q.options?.[2] || "Option C",
      q.option_d || q.options?.[3] || "Option D",
    ].filter(Boolean);

    generatedList.push({
      index,
      type: (q.type || "multiple-choice") as any,
      question: q.question || "Practice question from lesson",
      options,
      correctAnswer: q.correctAnswer || q.correct_answer || q.answer || options[0],
      explanation: q.correct_explanation || q.explanation || "Correct answer based on uploaded PDF.",
      difficulty: q.difficulty || "moderate",
      subjectCategory: "Lesson Core",
    });
    index++;
  });

  let conceptIdx = 0;
  while (index <= count) {
    const concept = concepts[conceptIdx % concepts.length];
    const qType = targetTypes[(index - 1) % targetTypes.length] as any;
    const diff = difficulty === "mixed" 
      ? (index % 3 === 0 ? "hard" : index % 2 === 0 ? "moderate" : "easy")
      : difficulty;

    if (qType === "multiple-choice") {
      const otherConcepts = concepts.filter((c) => c.term !== concept.term);
      const distractors = otherConcepts.slice(0, 3).map((c) => c.term);
      while (distractors.length < 3) {
        distractors.push(`Alternative Term ${distractors.length + 1}`);
      }
      
      const options = [concept.term, ...distractors].sort(() => Math.random() - 0.5);

      generatedList.push({
        index,
        type: "multiple-choice",
        question: `Which of the following terms is defined as: "${concept.desc}"?`,
        options,
        correctAnswer: concept.term,
        explanation: `"${concept.term}" matches the description. ${concept.desc}`,
        difficulty: diff,
        subjectCategory: "Concept Mastery",
      });
    } else if (qType === "true-false") {
      const isTrue = index % 2 === 0;
      let questionText = "";
      let answer = "";
      let explanation = "";

      if (isTrue) {
        questionText = `True or False: "${concept.term}" refers to: ${concept.desc}`;
        answer = "True";
        explanation = `Correct. "${concept.term}" is defined as: ${concept.desc}`;
      } else {
        const falseConcept = concepts[(conceptIdx + 1) % concepts.length];
        questionText = `True or False: "${concept.term}" refers to: ${falseConcept.desc}`;
        answer = "False";
        explanation = `Incorrect. "${concept.term}" is defined as: ${concept.desc}. The definition provided belongs to "${falseConcept.term}".`;
      }

      generatedList.push({
        index,
        type: "true-false",
        question: questionText,
        options: ["True", "False"],
        correctAnswer: answer,
        explanation,
        difficulty: diff,
        subjectCategory: "Concept True/False",
      });
    } else if (qType === "identification") {
      generatedList.push({
        index,
        type: "identification",
        question: `Identify the term: "${concept.desc}"`,
        correctAnswer: concept.term,
        explanation: `The term matches: "${concept.term}".`,
        difficulty: diff,
        subjectCategory: "Term Identification",
      });
    } else if (qType === "fill-blank") {
      const questionText = `The term "${concept.term}" describes a learning technique where: ________.`;
      generatedList.push({
        index,
        type: "fill-blank",
        question: questionText,
        correctAnswer: concept.desc,
        explanation: `"${concept.term}" refers to: ${concept.desc}`,
        difficulty: diff,
        subjectCategory: "Application Fill-in",
      });
    } else if (qType === "matching") {
      const pairs = concepts.slice(0, 4).map((c) => ({
        term: c.term,
        definition: c.desc,
      }));

      generatedList.push({
        index,
        type: "matching",
        question: "Match the following terms on the left with their correct definitions on the right:",
        correctAnswer: "All terms correctly mapped.",
        explanation: "Review definitions list to understand correct mappings.",
        difficulty: diff,
        subjectCategory: "Concept Matching",
        matchingPairs: pairs,
      });
    } else {
      generatedList.push({
        index,
        type: "short-answer",
        question: `Explain the significance of "${concept.term}" and outline its practical applications.`,
        correctAnswer: concept.desc,
        explanation: `Expected key concepts to include: "${concept.term}" which is ${concept.desc}`,
        difficulty: diff,
        subjectCategory: "Critical Review",
      });
    }

    index++;
    conceptIdx++;
  }

  return generatedList;
}
