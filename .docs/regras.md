## Regras de negócio importantes

1. **Proteção da senha**: a senha nunca é armazenada em texto puro — é protegida com hash via bcrypt (token de proteção embutido no próprio hash/salt). Não há geração de JWT nem de token de sessão separado; a validação de identidade acontece a partir do e-mail + senha em cada operação sensível.
2. **Gemini fica exclusivamente no backend**: a chave da API nunca é exposta ao frontend. O frontend só consome `GET /providers/:id/review-summary`.
3. **Gemini não decide matching**: a IA apenas resume avaliações; o matching é calculado pelo `matching.service.ts` com base em categoria + localização + status aprovado + disponibilidade.
4. **Controle de custo da IA**: armazenar/reutilizar o resumo do Gemini em vez de gerar a cada acesso; atualizar apenas quando houver quantidade relevante de novas avaliações.
5. **Prestador pendente/reprovado/suspenso/banido nunca aparece no matching.**
6. **A `DATABASE_URL` do Neon fica só no `.env`, nunca no código nem no GitHub.**
7. **Toda etapa a ser feita deve possior rum codigo simples de ser lido e que tenha uma facil manutenção**
