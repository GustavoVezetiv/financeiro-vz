import type { StatCardProps } from "@/components/ui/stat-card";

export type DashboardDecisionSection = {
  title: string;
  description: string;
  content: string;
};

export const dashboardStats: StatCardProps[] = [
  {
    label: "Contas pendentes",
    value: "R$ 2.480,00",
    helper: "Obrigações do mês aguardando decisão de pagamento.",
    tone: "warning",
  },
  {
    label: "Entradas previstas",
    value: "R$ 5.950,00",
    helper: "Entradas reais previstas, sem contar reembolsos como renda.",
    tone: "success",
  },
  {
    label: "Saldo projetado",
    value: "R$ 1.320,00",
    helper: "Estimativa visual para orientar o layout inicial.",
    tone: "info",
  },
  {
    label: "Prioridade alta",
    value: "3 itens",
    helper: "Contas e decisões que exigem atenção primeiro.",
    tone: "danger",
  },
  {
    label: "Reembolsos pendentes",
    value: "R$ 860,00",
    helper: "Dinheiro de terceiros que ainda precisa voltar via Pix.",
    tone: "warning",
  },
  {
    label: "Fatura crítica",
    value: "Nubank",
    helper: "Placeholder para destacar a fatura com maior pressão.",
    tone: "danger",
  },
];

export const dashboardDecisionSections: DashboardDecisionSection[] = [
  {
    title: "Atenção agora",
    description: "Itens que devem ser tratados antes de novas compras.",
    content:
      "Priorizar fatura próxima ao vencimento, confirmar reembolsos pendentes e revisar contas com risco alto.",
  },
  {
    title: "Melhor decisão do mês",
    description: "Espaço reservado para recomendação operacional.",
    content:
      "Ainda sem motor de regras. Na próxima fase, esta área deve cruzar saldo, vencimentos, faturas e reembolsos.",
  },
  {
    title: "Risco do mês",
    description: "Leitura resumida do que pode comprometer o caixa.",
    content:
      "A fatura crítica e a dependência de reembolsos serão separadas de renda real para evitar falsa folga.",
  },
  {
    title: "Fluxo dos próximos dias",
    description: "Visão curta para decidir o que pagar agora.",
    content:
      "Entradas, contas e faturas devem aparecer em ordem temporal quando a persistência for criada.",
  },
];

export const upcomingFlowRows: string[][] = [
  ["20/05", "Conta", "Internet", "R$ 129,90", "Pendente"],
  ["22/05", "Reembolso", "Compra paga para terceiro", "R$ 240,00", "Esperado"],
  ["25/05", "Fatura", "Cartão principal", "R$ 1.840,00", "Atenção"],
  ["28/05", "Receita", "Entrada recorrente", "R$ 5.500,00", "Prevista"],
];

export type PlaceholderModule = {
  title: string;
  eyebrow: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  columns: string[];
};

export const placeholderModules: Record<string, PlaceholderModule> = {
  accounts: {
    title: "Contas",
    eyebrow: "Obrigações",
    description: "Espaço para contas, dívidas e pagamentos que entram no plano mensal.",
    emptyTitle: "Nenhuma conta cadastrada",
    emptyDescription:
      "A próxima etapa vai permitir cadastrar contas a pagar com vencimento, prioridade e risco.",
    columns: ["Vencimento", "Descrição", "Valor", "Prioridade", "Status"],
  },
  income: {
    title: "Receitas",
    eyebrow: "Entradas reais",
    description: "Área para fontes de renda, separadas de reembolsos e dinheiro de terceiros.",
    emptyTitle: "Nenhuma receita cadastrada",
    emptyDescription:
      "Receitas recorrentes e ocasionais serão usadas para projetar o caixa do mês.",
    columns: ["Data", "Fonte", "Valor", "Recorrência", "Status"],
  },
  people: {
    title: "Pessoas",
    eyebrow: "Responsáveis",
    description: "Cadastro de pessoas vinculadas a despesas reembolsáveis ou de terceiros.",
    emptyTitle: "Nenhuma pessoa cadastrada",
    emptyDescription:
      "Pessoas serão usadas para rastrear quem deve reembolsar cada despesa.",
    columns: ["Nome", "Relação", "Pix", "Em aberto", "Status"],
  },
  cards: {
    title: "Cartões",
    eyebrow: "Crédito",
    description: "Visão dos cartões, limites, ciclos de fechamento e cashback.",
    emptyTitle: "Nenhum cartão cadastrado",
    emptyDescription:
      "Cartões serão o centro das faturas e das compras feitas para gerar cashback.",
    columns: ["Cartão", "Emissor", "Limite", "Fechamento", "Vencimento"],
  },
  invoices: {
    title: "Faturas",
    eyebrow: "Pressão mensal",
    description: "Acompanhamento de faturas abertas, fechadas e pagas.",
    emptyTitle: "Nenhuma fatura cadastrada",
    emptyDescription:
      "Faturas vão separar valor pessoal, valor reembolsável e impacto no próximo mês.",
    columns: ["Cartão", "Mês", "Total", "Reembolsável", "Status"],
  },
  reimbursements: {
    title: "Reembolsos",
    eyebrow: "Dinheiro de terceiros",
    description:
      "Reembolsos são entidades centrais e nunca devem ser confundidos com renda livre.",
    emptyTitle: "Nenhum reembolso cadastrado",
    emptyDescription:
      "Aqui ficarão valores esperados, parciais e recebidos, sempre ligados à origem.",
    columns: ["Pessoa", "Origem", "Esperado", "Recebido", "Status"],
  },
  installments: {
    title: "Parcelamentos",
    eyebrow: "Impacto futuro",
    description: "Controle visual das parcelas que pressionam faturas futuras.",
    emptyTitle: "Nenhum parcelamento cadastrado",
    emptyDescription:
      "Parcelamentos vão mostrar o efeito de cada compra nos próximos meses.",
    columns: ["Compra", "Parcela", "Valor", "Fatura", "Status"],
  },
  "cash-flow": {
    title: "Fluxo de caixa",
    eyebrow: "Projeção",
    description: "Projeção mensal separando renda confirmada, despesas e reembolsos.",
    emptyTitle: "Fluxo ainda sem dados",
    emptyDescription:
      "A projeção será construída após contas, receitas, faturas e reembolsos existirem.",
    columns: ["Data", "Movimento", "Tipo", "Valor", "Confiança"],
  },
  "payment-plans": {
    title: "Plano de pagamento",
    eyebrow: "Decisão mensal",
    description: "Área para decidir o que pagar agora, esperar, parcelar ou monitorar.",
    emptyTitle: "Nenhum plano criado",
    emptyDescription:
      "Planos mensais vão reunir contas, faturas, compras e decisões de prioridade.",
    columns: ["Item", "Valor", "Decisão", "Risco", "Status"],
  },
  purchases: {
    title: "Compras e desejos",
    eyebrow: "Planejamento",
    description: "Lista de compras consideradas antes de virarem dívida ou fatura.",
    emptyTitle: "Nenhuma compra planejada",
    emptyDescription:
      "Compras planejadas devem ajudar a decidir entre comprar agora, esperar ou parcelar.",
    columns: ["Compra", "Valor estimado", "Data alvo", "Forma", "Decisão"],
  },
  goals: {
    title: "Metas",
    eyebrow: "Objetivos",
    description: "Acompanhamento simples de reserva, redução de dívida e objetivos.",
    emptyTitle: "Nenhuma meta cadastrada",
    emptyDescription:
      "Metas serão consideradas no planejamento mensal e nas projeções de saldo.",
    columns: ["Meta", "Atual", "Alvo", "Contribuição", "Status"],
  },
  imports: {
    title: "Importações",
    eyebrow: "CSV e XLSX",
    description:
      "Fundação para importar planilhas com preview e validação antes de salvar.",
    emptyTitle: "Nenhuma importação iniciada",
    emptyDescription:
      "Imports serão preparados em lotes e linhas temporárias antes de virar dado oficial.",
    columns: ["Arquivo", "Módulo", "Linhas", "Válidas", "Status"],
  },
  notes: {
    title: "Notas",
    eyebrow: "Contexto",
    description: "Anotações para decisões, faturas, pessoas, reembolsos e planos.",
    emptyTitle: "Nenhuma nota criada",
    emptyDescription:
      "Notas vão guardar o contexto por trás das decisões financeiras do mês.",
    columns: ["Título", "Entidade", "Fixada", "Criada em", "Status"],
  },
  settings: {
    title: "Configurações",
    eyebrow: "Preferências",
    description: "Espaço para perfil, moeda, timezone e preferências do mês financeiro.",
    emptyTitle: "Configurações ainda não conectadas",
    emptyDescription:
      "Na fase de Auth, esta área será ligada ao perfil do usuário autenticado.",
    columns: ["Preferência", "Valor", "Escopo", "Atualizado", "Status"],
  },
};

