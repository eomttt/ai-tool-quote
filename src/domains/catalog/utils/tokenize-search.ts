import vocabulary from '../data/search-vocabulary.json';

const stopWords = new Set(vocabulary.stopWords);
const aliases = vocabulary.synonyms
  .flatMap(({ term, aliases }) => aliases.map((alias) => ({ term, alias })))
  .toSorted((a, b) => b.alias.length - a.alias.length);
const aliasPattern = new RegExp(
  aliases
    .map(({ alias }) => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll(' ', '\\s*');
      return /[a-z]/i.test(alias) ? `(?<![a-z0-9])${escaped}(?![a-z0-9])` : escaped;
    })
    .join('|'),
  'giu',
);
const canonicalTerms = new Map(
  aliases.map(({ alias, term }) => [alias.toLowerCase().replaceAll(' ', ''), term]),
);

export function tokenizeSearch(text: string) {
  const normalized = text
    .normalize('NFKC')
    .toLowerCase()
    .replace(aliasPattern, (match) => ` ${canonicalTerms.get(match.replace(/\s/g, '')) ?? match} `);
  return (normalized.match(/[\p{L}\p{N}]+/gu) ?? [])
    .map((term) =>
      term.length > 2
        ? term.replace(/(으로|에서|하고|해서|을|를|은|는|이|가|로|에|도)$/u, '')
        : term,
    )
    .filter((term) => term.length > 1 && !stopWords.has(term));
}
