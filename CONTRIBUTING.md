# Contributing / Contribuindo

Thanks for your interest! · Obrigado pelo interesse!

## English

- **Bugs & ideas:** open an issue describing the problem or proposal.
- **Code:** fork, create a branch, and open a pull request. Keep changes focused.
  Please make sure type-check and build pass locally before opening a PR:
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
  mudanças focadas. Garanta que a checagem de tipos e o build passam localmente
  antes de abrir o PR (comandos acima).
- **Traduções:** veja a seção [Traduções](README.pt-BR.md#-traduções) no README.
  Adicione um `README.<código>.md` e um badge no seletor de idioma.
- Nunca faça commit de segredos. `.env*`, `CLAUDE.md` e `AGENTS.md` estão no
  `.gitignore`.
