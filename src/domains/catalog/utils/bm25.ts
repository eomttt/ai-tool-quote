import { tokenizeSearch } from './tokenize-search';

interface SearchField {
  text: string;
  weight: number;
}
interface SearchDocument {
  id: string;
  fields: SearchField[];
}

export function createBm25Index(documents: SearchDocument[]) {
  const indexed = documents.map((document) => ({
    id: document.id,
    fields: document.fields.map((field) => {
      const tokens = tokenizeSearch(field.text);
      const frequencies = new Map<string, number>();
      for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
      return { frequencies, length: tokens.length, weight: field.weight };
    }),
  }));
  const averageLengths =
    documents[0]?.fields.map(
      (_, position) =>
        indexed.reduce((total, document) => total + (document.fields[position]?.length ?? 0), 0) /
          indexed.length || 1,
    ) ?? [];
  const documentFrequencies = new Map<string, number>();
  for (const document of indexed) {
    const tokens = new Set(document.fields.flatMap((field) => [...field.frequencies.keys()]));
    for (const token of tokens)
      documentFrequencies.set(token, (documentFrequencies.get(token) ?? 0) + 1);
  }
  return {
    search(query: string) {
      const terms = [...new Set(tokenizeSearch(query))];
      const k1 = 1.2;
      const b = 0.75;
      return indexed
        .map((document) => {
          let score = 0;
          const matchedTerms: string[] = [];
          for (const term of terms) {
            let weightedFrequency = 0;
            for (const [position, field] of document.fields.entries()) {
              const frequency = field.frequencies.get(term) ?? 0;
              const lengthCorrection = 1 - b + (b * field.length) / (averageLengths[position] ?? 1);
              weightedFrequency += (field.weight * frequency) / lengthCorrection;
            }
            if (!weightedFrequency) continue;
            const frequency = documentFrequencies.get(term) ?? 0;
            const idf = Math.log(1 + (indexed.length - frequency + 0.5) / (frequency + 0.5));
            score += (idf * weightedFrequency * (k1 + 1)) / (weightedFrequency + k1);
            matchedTerms.push(term);
          }
          return { id: document.id, score, matchedTerms };
        })
        .filter((match) => match.score > 0)
        .toSorted((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    },
  };
}
