# Contributing / Contribuindo

Thanks for your interest! · Obrigado pelo interesse!

## English

- **Bugs & ideas:** open an issue describing the problem or proposal.
- **Code:** fork, create a branch, and open a pull request. Keep changes focused.
  CI runs `tsc --noEmit` and `next build` — make sure both pass locally:
  ```bash
  npm install
  npx tsc --noEmit
  npm run build
  ```
- **Translations:** see the [Translations](README.md#-translations) section in
  the README. Add a `README.<code>.md` and a badge to the language switcher.
- Never commit secrets. `.env*`, `CLAUDE.md` and `AGENTS.md` are gitignored.

## Português

- **Bugs & ideias:** abra uma issue descrevendo o problema ou a proposta.
- **Código:** faça um fork, crie um branch e abra um pull request. Mantenha as
  mudanças focadas. O CI roda `tsc --noEmit` e `next build` — garanta que os
  dois passam localmente (comandos acima).
- **Traduções:** veja a seção [Traduções](README.pt-BR.md#-traduções) no README.
  Adicione um `README.<código>.md` e um badge no seletor de idioma.
- Nunca faça commit de segredos. `.env*`, `CLAUDE.md` e `AGENTS.md` estão no
  `.gitignore`.
