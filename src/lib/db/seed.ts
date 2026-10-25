import { GlossaryTerm, SpecialTerm, syncDatabase } from "./models";

export const INITIAL_GLOSSARY = [
  { foreignStem: "meeting", armenianLemma: "հանդիպում", category: "business", confidence: 0.95 },
  { foreignStem: "report", armenianLemma: "հաշվետվություն", category: "business", confidence: 0.95 },
  { foreignStem: "call", armenianLemma: "զանգ", category: "everyday", confidence: 0.90 },
  { foreignStem: "email", armenianLemma: "նամակ", category: "technology", confidence: 0.95 },
  { foreignStem: "mail", armenianLemma: "նամակ", category: "technology", confidence: 0.90 },
  { foreignStem: "project", armenianLemma: "նախագիծ", category: "business", confidence: 0.95 },
  { foreignStem: "task", armenianLemma: "առաջադրանք", category: "business", confidence: 0.92 },
  { foreignStem: "deadline", armenianLemma: "վերջնաժամկետ", category: "business", confidence: 0.95 },
  { foreignStem: "team", armenianLemma: "թիմ", category: "business", confidence: 0.90 },
  { foreignStem: "presentation", armenianLemma: "շնորհանդես", category: "business", confidence: 0.92 },
  { foreignStem: "client", armenianLemma: "հաճախորդ", category: "business", confidence: 0.92 },
  { foreignStem: "customer", armenianLemma: "հաճախորդ", category: "business", confidence: 0.90 },
  { foreignStem: "feedback", armenianLemma: "արձագանք", category: "business", confidence: 0.92 },
  { foreignStem: "update", armenianLemma: "թարմացում", category: "technology", confidence: 0.90 },
  { foreignStem: "link", armenianLemma: "հղում", category: "technology", confidence: 0.92 },
  { foreignStem: "document", armenianLemma: "փաստաթուղթ", category: "office", confidence: 0.95 },
  { foreignStem: "message", armenianLemma: "հաղորդագրություն", category: "technology", confidence: 0.92 },
  { foreignStem: "bug", armenianLemma: "խնդիր", category: "technology", confidence: 0.90 },
  { foreignStem: "developer", armenianLemma: "ծրագրավորող", category: "technology", confidence: 0.92 },
  { foreignStem: "interview", armenianLemma: "հարցազրույց", category: "business", confidence: 0.95 },
  { foreignStem: "schedule", armenianLemma: "ժամանակացույց", category: "business", confidence: 0.92 },
];

export const INITIAL_SPECIAL_TERMS = [
  { term: "Google", category: "brand" },
  { term: "Apple", category: "brand" },
  { term: "Microsoft", category: "brand" },
  { term: "Amazon", category: "brand" },
  { term: "Telegram", category: "brand" },
  { term: "WhatsApp", category: "brand" },
  { term: "Zoom", category: "brand" },
  { term: "Slack", category: "brand" },
  { term: "GitHub", category: "brand" },
  { term: "Docker", category: "technology" },
  { term: "Python", category: "technology" },
  { term: "JavaScript", category: "technology" },
  { term: "TypeScript", category: "technology" },
  { term: "React", category: "technology" },
  { term: "Next.js", category: "technology" },
  { term: "Linux", category: "technology" },
  { term: "Windows", category: "technology" },
  { term: "BarBar", category: "brand" },
  { term: "Whisper", category: "technology" },
  { term: "Hugging Face", category: "brand" },
];

export const INITIAL_PROTECTED_TERMS = INITIAL_SPECIAL_TERMS;

export async function seedDatabaseIfEmpty() {
  await syncDatabase();

  const glossaryCount = await GlossaryTerm.count();
  if (glossaryCount === 0) {
    for (const item of INITIAL_GLOSSARY) {
      await GlossaryTerm.create({
        ...item,
        isSystem: true,
      });
    }
  }

  const specialCount = await SpecialTerm.count();
  if (specialCount === 0) {
    for (const item of INITIAL_SPECIAL_TERMS) {
      await SpecialTerm.create({
        ...item,
        isSystem: true,
      });
    }
  }
}

