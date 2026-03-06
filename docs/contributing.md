# Contribuindo

Obrigado por contribuir com o `pg-query-sdk`.

## Fluxo sugerido
1. Abra uma issue descrevendo bug/feature.
2. Crie branch de trabalho.
3. Implemente com testes.
4. Atualize docs.
5. Abra PR com contexto tecnico claro.

## Setup local

```bash
npm install
npm run build
npm test
```

## Padrao de commits
- `feat: ...`
- `fix: ...`
- `docs: ...`
- `refactor: ...`
- `test: ...`
- `chore: ...`

## Pull Request checklist
- [ ] Sem breaking change nao documentado
- [ ] Testes passando
- [ ] Docs atualizadas
- [ ] Sem credenciais no codigo

## Reportando bugs
Inclua:
- versao do pacote
- Node.js
- query esperada vs obtida
- stack trace
- passo a passo de reproducao

## Melhorias de documentacao
Mudancas de docs sao bem-vindas mesmo sem alteracao de codigo.

Consulte tambem: [CODE_OF_CONDUCT](./CODE_OF_CONDUCT.md)

