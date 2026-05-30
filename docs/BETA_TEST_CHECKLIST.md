# Checklist de Validacao Beta

Use este checklist antes de usar o HUBControle-vz com dados reais em producao privada.

## Fluxo Base

- [ ] Abrir a URL de producao.
- [ ] Criar uma conta nova por email e senha.
- [ ] Fazer login com conta existente.
- [ ] Confirmar que usuario deslogado e redirecionado para `/login`.
- [ ] Confirmar que usuario logado acessa `/dashboard`.
- [ ] Recarregar a pagina e confirmar sessao persistente.
- [ ] Fazer logout.
- [ ] Confirmar que logout remove acesso ao dashboard.

## Modulos

Para cada modulo abaixo, validar criacao, edicao, exclusao, recarregamento e persistencia.

- [ ] Dashboard
- [ ] Categorias
- [ ] Pessoas
- [ ] Contas
- [ ] Receitas
- [ ] Cartoes
- [ ] Faturas
- [ ] Lancamentos de fatura
- [ ] Reembolsos
- [ ] Parcelamentos
- [ ] Plano de pagamento
- [ ] Compras e desejos
- [ ] Metas
- [ ] Anotacoes
- [ ] Importacoes MVP

## Testes Criticos por Modulo

Execute estes testes nos modulos que possuem CRUD.

- [ ] Criar registro com dados minimos obrigatorios.
- [ ] Criar registro com campos opcionais preenchidos.
- [ ] Editar registro existente.
- [ ] Excluir registro criado para teste.
- [ ] Recarregar a pagina apos criar e confirmar persistencia.
- [ ] Recarregar a pagina apos editar e confirmar persistencia.
- [ ] Tentar salvar formulario invalido e confirmar erro visivel.
- [ ] Confirmar que nenhum botao fica travado em "Salvando...", "Importando..." ou estado equivalente apos erro.
- [ ] Confirmar que campos de valor aceitam zero quando permitido e bloqueiam valores invalidos.
- [ ] Confirmar que datas invalidas nao quebram a tela.
- [ ] Confirmar que empty state aparece quando nao ha registros.
- [ ] Confirmar que filtros nao quebram paginas sem dados.

## Isolamento de Dados

Teste obrigatorio antes de beta privado com dados reais.

- [ ] Criar registros usando o Usuario A.
- [ ] Fazer logout.
- [ ] Entrar com o Usuario B.
- [ ] Confirmar que Usuario B nao ve dados do Usuario A.
- [ ] Criar registros usando o Usuario B.
- [ ] Fazer logout.
- [ ] Entrar novamente com o Usuario A.
- [ ] Confirmar que Usuario A nao ve dados do Usuario B.

## Dashboard

- [ ] Cards carregam sem erro.
- [ ] Contas pendentes refletem contas reais.
- [ ] Receitas previstas refletem receitas reais.
- [ ] Reembolsos aparecem separados de renda livre.
- [ ] Dinheiro de terceiros aparece separado de renda livre.
- [ ] Faturas e parcelamentos aparecem como pressao financeira.
- [ ] Plano ativo aparece quando existir.
- [ ] Empty state aparece quando nao houver plano ativo.

## Categorias

- [ ] Criar categoria manual.
- [ ] Criar categorias padrao para o usuario.
- [ ] Filtrar por tipo.
- [ ] Editar nome, tipo, cor e icone.
- [ ] Excluir categoria de teste.

## Pessoas

- [ ] Criar pessoa do tipo familia.
- [ ] Criar pessoa do tipo amigo ou pagador.
- [ ] Buscar por nome.
- [ ] Editar email, telefone e observacoes.
- [ ] Excluir pessoa de teste.

## Contas

- [ ] Criar conta pendente.
- [ ] Editar prioridade e status.
- [ ] Filtrar por periodo, status, prioridade e categoria.
- [ ] Marcar conta como paga.
- [ ] Criar conta recorrente simples.
- [ ] Gerar proximas ocorrencias sem duplicar contas ja geradas.
- [ ] Confirmar que recorrencia nao altera contas pagas automaticamente.

## Receitas

- [ ] Criar renda real.
- [ ] Criar reembolso esperado.
- [ ] Criar dinheiro de terceiro esperado.
- [ ] Confirmar separacao visual entre renda, reembolso e dinheiro de terceiro.
- [ ] Filtrar por periodo, status, tipo, confianca e categoria.

## Cartoes

- [ ] Criar cartao ativo.
- [ ] Editar limite, fechamento e vencimento.
- [ ] Buscar por nome ou emissor.
- [ ] Marcar cartao inativo.
- [ ] Excluir cartao de teste sem relacoes importantes.

## Faturas e Lancamentos

- [ ] Criar fatura ligada a cartao.
- [ ] Editar status, valor total e valor pago.
- [ ] Filtrar por periodo, cartao e status.
- [ ] Abrir detalhe da fatura.
- [ ] Criar lancamento pessoal.
- [ ] Criar lancamento de terceiro, compartilhado ou familia.
- [ ] Marcar lancamento como reembolsavel.
- [ ] Confirmar que custo pessoal liquido considera reembolsos esperados quando aplicavel.

## Reembolsos

- [ ] Criar reembolso manual ligado a pessoa.
- [ ] Criar reembolso ligado a lancamento, quando aplicavel.
- [ ] Editar valor recebido e status.
- [ ] Filtrar por periodo, pessoa e status.
- [ ] Confirmar que reembolso nao aparece como renda livre.

## Parcelamentos

- [ ] Criar parcelamento de cartao.
- [ ] Criar parcelamento vinculado a fatura.
- [ ] Criar parcelamento fora do cartao.
- [ ] Confirmar exibicao de origem.
- [ ] Confirmar exibicao de "Fora do cartao" quando nao houver vinculo.
- [ ] Confirmar aviso visual quando parcelamento estiver vinculado a fatura.
- [ ] Confirmar que parcelamento ativo entra como pressao mensal.

## Plano de Pagamento

- [ ] Criar plano em rascunho.
- [ ] Marcar plano como ativo.
- [ ] Adicionar item manual.
- [ ] Adicionar item a partir de conta pendente.
- [ ] Adicionar item a partir de fatura aberta.
- [ ] Adicionar item a partir de parcelamento ativo.
- [ ] Adicionar item a partir de receita esperada.
- [ ] Adicionar item a partir de reembolso pendente.
- [ ] Alterar decisao do item.
- [ ] Confirmar totais do simulador.
- [ ] Confirmar textos de alerta quando caixa estimado ficar negativo ou risco critico existir.

## Compras e Desejos

- [ ] Criar compra planejada.
- [ ] Editar prioridade, status e data alvo.
- [ ] Filtrar por periodo.
- [ ] Excluir compra de teste.

## Metas

- [ ] Criar meta pessoal.
- [ ] Editar valor alvo, valor atual e data alvo.
- [ ] Confirmar progresso visual.
- [ ] Excluir meta de teste.

## Anotacoes

- [ ] Criar anotacao.
- [ ] Editar conteudo.
- [ ] Buscar ou filtrar se disponivel.
- [ ] Excluir anotacao de teste.

## Importacoes MVP

Targets ativos no beta:

- [ ] Pessoas
- [ ] Categorias
- [ ] Contas
- [ ] Receitas

Validar:

- [ ] Baixar modelo CSV.
- [ ] Preencher arquivo com uma linha valida.
- [ ] Fazer upload CSV.
- [ ] Fazer upload XLSX.
- [ ] Ver pre-visualizacao antes de confirmar.
- [ ] Ver erros de validacao em portugues.
- [ ] Ignorar linha individual.
- [ ] Confirmar importacao.
- [ ] Confirmar que apenas linhas validas e nao ignoradas foram inseridas.
- [ ] Confirmar resumo de linhas importadas, invalidas, ignoradas e com falha.
- [ ] Confirmar que targets futuros aparecem como "Em breve" ou ficam desabilitados.

## Supabase

- [ ] Todas as migrations foram rodadas em ordem.
- [ ] RLS esta ativo em todas as tabelas de usuario.
- [ ] Policies restringem select por `user_id = auth.uid()`.
- [ ] Policies restringem insert por `user_id = auth.uid()`.
- [ ] Policies restringem update por `user_id = auth.uid()`.
- [ ] Policies restringem delete por `user_id = auth.uid()`.
- [ ] Auth Site URL aponta para a URL de producao.
- [ ] Redirect URLs incluem producao e localhost quando necessario.
- [ ] Nenhuma service role key foi colocada no frontend.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` esta correto.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` esta correto.
- [ ] `NEXT_PUBLIC_SITE_URL` esta correto.

## Vercel

- [ ] Variaveis de ambiente configuradas em Production.
- [ ] Variaveis de ambiente configuradas em Preview, se aplicavel.
- [ ] Build de producao passando.
- [ ] Deploy de Production concluido.
- [ ] Dominio correto configurado.
- [ ] Preview deploy funcionando, se aplicavel.
- [ ] Reload de rota protegida nao quebra a sessao.

## Criterio de Aprovacao do Beta

- [ ] Login, logout e sessao persistente funcionam.
- [ ] CRUD principal funciona sem travar botoes.
- [ ] Dados persistem apos reload.
- [ ] Dados ficam isolados por usuario.
- [ ] Dashboard nao mistura renda real com reembolsos como renda livre.
- [ ] Importacoes MVP funcionam somente para os targets suportados.
- [ ] `npm run lint` passa.
- [ ] `npm run build` passa.
