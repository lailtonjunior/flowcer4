
prompt-sistema-agendamentos-vercel
Prompt completo para Claude Code — Sistema de Agendamentos com Admin e Tela Ao Vivo
Papel

Você é um engenheiro de software sênior, arquiteto de soluções e product engineer. Sua tarefa é criar uma aplicação web pronta para produção, com foco em confiabilidade, clareza visual, segurança de acesso e deploy na Vercel.
Objetivo do produto

Criar um sistema de agendamentos de horários para clínica/centro de atendimentos multidisciplinares.

O sistema deve ter apenas um tipo de usuário com login: administrador.

Este administrador poderá:

    cadastrar, editar e remover profissionais;

    cadastrar, editar e remover pacientes;

    definir disponibilidade semanal dos profissionais;

    criar, editar, remarcar e cancelar agendamentos;

    bloquear horários específicos;

    visualizar conflitos e impedir sobreposição de horários;

    controlar tudo através de um painel administrativo.

Além disso, deve existir uma segunda página separada, sem edição, destinada apenas à visualização em tempo real da agenda.

Essa página de visualização deve:

    exibir os horários atualizados automaticamente;

    ser otimizada para uso em monitor/TV/recepção/sala administrativa;

    funcionar em modo somente leitura;

    não permitir login de profissional;

    não permitir qualquer edição direta;

    refletir imediatamente alterações feitas no painel admin.

Contexto de uso

O cenário é uma operação com vários profissionais, pacientes e atendimentos por dia da semana, semelhante a uma grade de horários exibida continuamente em tela. A solução atual é manual e visual, e a nova aplicação deve substituir esse processo por um sistema organizado, confiável e fácil de operar.
Resultado esperado

Quero uma aplicação completa, moderna e organizada, com:

    frontend responsivo;

    backend integrado ao banco;

    autenticação apenas para admin;

    atualização em tempo real da tela de visualização;

    arquitetura limpa;

    código pronto para deploy na Vercel;

    README com instruções de setup;

    scripts SQL necessários;

    boas práticas de segurança e UX.

Decisões técnicas obrigatórias
Stack obrigatória

Use esta stack, salvo se houver algum motivo técnico realmente forte para justificar ajuste:

    Next.js 15+ com App Router

    TypeScript

    Tailwind CSS

    shadcn/ui para componentes-base

    Supabase para Auth, PostgreSQL e Realtime

    React Hook Form + Zod para formulários e validação

    date-fns para datas

    Lucide React para ícones

    TanStack Table onde fizer sentido em listagens administrativas

    Server Actions e Route Handlers quando apropriado

Regras de arquitetura

    usar estrutura organizada por domínio;

    evitar código monolítico em um único arquivo;

    separar componentes, actions, services, validators e types;

    usar tipagem forte em todo o projeto;

    priorizar componentes reutilizáveis;

    criar uma base pronta para evolução futura;

    preparar tudo para deploy na Vercel sem dependências desnecessárias.

Persistência e realtime

    usar Supabase PostgreSQL como banco principal;

    usar Supabase Realtime para atualizar a página de visualização ao vivo;

    garantir atualização automática quando um agendamento for criado, alterado, cancelado ou bloqueado.

Requisitos funcionais
1. Autenticação

Implementar autenticação somente para administrador.

Regras:

    apenas admins autenticados acessam /admin;

    qualquer rota administrativa deve ser protegida;

    usuários não autenticados devem ser redirecionados para /login;

    a página /ao-vivo pode ser pública ou protegida por um token de exibição simples configurável por variável de ambiente; implemente da forma mais segura e prática, com preferência por um modo público opcional.

2. Painel administrativo

Criar um painel administrativo com as seguintes áreas:
Dashboard

    resumo de agendamentos do dia;

    quantidade por profissional;

    horários livres e ocupados;

    bloqueios do dia;

    próximos atendimentos.

Gestão de profissionais

Cada profissional deve ter:

    nome completo;

    especialidade/categoria;

    cor de destaque para exibição na agenda;

    sala/unidade opcional;

    status ativo/inativo;

    duração padrão do atendimento em minutos;

    observações internas.

Gestão de pacientes

Cada paciente deve ter:

    nome completo;

    código/prontuário opcional;

    data de nascimento opcional;

    nome do responsável opcional;

    telefone opcional;

    observações curtas.

Disponibilidade semanal

Permitir configurar a agenda-base dos profissionais:

    dias da semana em que atendem;

    horário inicial e final por dia;

    intervalo entre atendimentos;

    bloqueios fixos, como almoço ou reunião;

    possibilidade de exceções por data.

Agendamentos

Permitir ao admin:

    criar agendamento;

    editar agendamento;

    remarcar agendamento;

    cancelar agendamento;

    marcar falta;

    confirmar presença;

    bloquear um slot sem paciente;

    filtrar por profissional, data, turno e especialidade.

Regras de negócio dos agendamentos

    não permitir dois pacientes no mesmo horário para o mesmo profissional;

    não permitir agendar fora da disponibilidade do profissional;

    não permitir agendar em slot bloqueado;

    permitir configurar duração por atendimento;

    mostrar conflitos com mensagens claras;

    registrar histórico mínimo de criação e alteração.

3. Tela de visualização em tempo real

Criar uma página /ao-vivo focada em exibição contínua em monitor.

Essa tela deve:

    atualizar automaticamente sem refresh manual;

    ter layout limpo e legível à distância;

    mostrar agenda por dia;

    permitir filtro visual por profissional, especialidade, turno ou sala;

    destacar horários do momento atual;

    diferenciar status como agendado, confirmado, cancelado, bloqueado e falta;

    usar cores por profissional ou especialidade de forma consistente;

    funcionar muito bem em resolução Full HD;

    ter opção de modo escuro/claro;

    ter opção de auto refresh visual suave ou realtime websocket.

4. Auditoria mínima

Registrar em banco:

    quem criou o agendamento;

    quem alterou o agendamento;

    quando foi criado;

    quando foi atualizado;

    status anterior e novo status quando aplicável.

Requisitos de UX e UI
Direção visual

A identidade visual deve usar esta paleta, já adotada no projeto:

    navy

    aqua

    teal

    sand

Diretrizes visuais

    criar interface profissional, limpa e moderna;

    evitar visual genérico de template SaaS;

    excelente contraste e legibilidade;

    foco em produtividade no admin;

    foco em leitura rápida na tela ao vivo;

    usar cores de forma funcional, não excessiva;

    destacar o “agora” da agenda com elegância;

    manter tipografia clara e espaçamento consistente.

Sugestão de uso da paleta

Crie tokens semânticos, por exemplo:

    bg: sand muito claro ou fundo neutro derivado;

    surface: branco ou sand suave;

    primary: navy;

    accent: teal;

    highlight: aqua;

    muted: variações neutras derivadas;

    border: sand escurecido/neutro;

    success/warning/error: cores auxiliares discretas e consistentes.

Comportamento responsivo

    o painel admin deve funcionar bem em desktop e notebook;

    mobile pode ser suportado, mas a prioridade é desktop;

    a tela /ao-vivo deve ser pensada primeiro para monitores grandes;

    ainda assim, não deve quebrar em telas menores.

Modelagem de dados

Crie uma modelagem consistente no Supabase/PostgreSQL.
Tabelas mínimas
admin_users

Campos sugeridos:

    id

    auth_user_id

    name

    email

    created_at

    updated_at

professionals

Campos sugeridos:

    id

    name

    specialty

    display_color

    room

    default_appointment_minutes

    is_active

    notes

    created_at

    updated_at

patients

Campos sugeridos:

    id

    name

    record_code

    birth_date

    guardian_name

    phone

    notes

    created_at

    updated_at

professional_weekly_availability

Campos sugeridos:

    id

    professional_id

    weekday

    start_time

    end_time

    slot_minutes

    is_active

    created_at

    updated_at

professional_blocks

Para bloqueios fixos ou excepcionais.
Campos sugeridos:

    id

    professional_id

    block_date

    weekday

    start_time

    end_time

    reason

    recurring

    created_at

    updated_at

appointments

Campos sugeridos:

    id

    professional_id

    patient_id

    appointment_date

    start_time

    end_time

    status

    source

    notes

    created_by

    updated_by

    created_at

    updated_at

appointment_audit_logs

Campos sugeridos:

    id

    appointment_id

    action_type

    previous_data

    new_data

    performed_by

    performed_at

Enum sugerido para status

Criar enum ou validação forte para:

    scheduled

    confirmed

    completed

    cancelled

    no_show

    blocked

Segurança e permissões
Acesso

Implementar proteção séria.
Regras obrigatórias

    somente admin autenticado pode inserir, editar ou remover dados;

    somente admin autenticado pode acessar páginas administrativas;

    a página /ao-vivo jamais pode expor ações de edição;

    proteger dados sensíveis com políticas adequadas;

    usar middleware e validação também no servidor;

    nunca confiar apenas na UI para proteger operações.

RLS

Configurar Row Level Security no Supabase.

Objetivo:

    admin pode fazer CRUD completo;

    tela /ao-vivo faz apenas leitura do necessário;

    se optar por tornar /ao-vivo pública, limitar a seleção somente aos campos necessários para exibição.

Boas práticas

    validar tudo com Zod;

    sanitizar inputs;

    tratar erros com mensagens amigáveis;

    não vazar stack trace para a interface;

    usar variáveis de ambiente corretamente;

    documentar setup do Supabase e Vercel.

Estrutura esperada do projeto

Monte uma estrutura semelhante a esta, podendo refinar:

text
src/
  app/
    (public)/
      ao-vivo/
        page.tsx
      login/
        page.tsx
    (admin)/
      admin/
        page.tsx
        profissionais/
          page.tsx
        pacientes/
          page.tsx
        agenda/
          page.tsx
        configuracoes/
          page.tsx
    api/
      ...
    layout.tsx
    globals.css
  components/
    ui/
    admin/
    agenda/
    ao-vivo/
    forms/
  lib/
    supabase/
    auth/
    validators/
    utils/
    constants/
  services/
    appointments/
    professionals/
    patients/
  types/
  hooks/
  middleware.ts

Funcionalidades específicas da agenda
Visões necessárias

No mínimo, implementar:

    visão diária;

    visão semanal;

    filtro por profissional;

    filtro por especialidade;

    filtro por turno;

    destaque visual do horário atual.

Experiência de criação/edição

No admin, criar uma experiência eficiente:

    botão de novo agendamento;

    modal ou drawer para criação rápida;

    autocomplete para paciente;

    seleção fácil de profissional;

    seleção de data e hora com prevenção de conflito;

    feedback visual imediato após salvar.

Realtime na tela ao vivo

Quando o admin:

    cria um horário,

    remarca,

    cancela,

    bloqueia,

a tela /ao-vivo deve refletir isso automaticamente.
Qualidade de código
Padrões

    escrever código limpo e legível;

    usar nomes claros;

    evitar duplicação;

    extrair componentes reutilizáveis;

    usar loading states, empty states e error states;

    criar toasts ou feedbacks discretos;

    evitar comentários excessivos e óbvios.

Tipagem

    nada de any sem justificativa forte;

    tipar formulários, entidades, responses e componentes;

    centralizar tipos de domínio quando fizer sentido.

Validação

    validar formulários no client e no server;

    validar regras de negócio no server;

    impedir inconsistências mesmo que o frontend falhe.

Entregáveis obrigatórios

Quero que você gere:

    aplicação completa com código-fonte;

    scripts SQL de criação de tabelas, índices e RLS;

    autenticação admin funcionando;

    painel admin funcional;

    tela /ao-vivo funcional com realtime;

    dados de exemplo/seeds;

    README completo com setup local;

    instruções de deploy na Vercel;

    .env.example;

    documentação curta da arquitetura.

Ordem de execução desejada

Execute o trabalho nesta ordem:

    definir arquitetura do projeto;

    criar schema do banco;

    criar SQL com RLS;

    configurar Supabase client/server;

    implementar autenticação admin;

    construir layout e design system com a paleta informada;

    implementar CRUD de profissionais;

    implementar CRUD de pacientes;

    implementar disponibilidade semanal;

    implementar agenda e regras de conflito;

    implementar auditoria mínima;

    implementar página /ao-vivo com realtime;

    adicionar seeds;

    criar README final;

    revisar consistência e corrigir problemas.

Critérios de aceitação

Considere o trabalho concluído apenas se tudo abaixo estiver atendido:

    login admin funcional;

    rotas admin protegidas;

    CRUD de profissionais funcional;

    CRUD de pacientes funcional;

    definição de disponibilidade funcional;

    criação e edição de agendamentos funcional;

    bloqueio de horários funcional;

    prevenção de conflito funcionando de verdade;

    tela /ao-vivo atualizando em tempo real;

    layout visual coerente com navy, aqua, teal e sand;

    projeto rodando localmente;

    projeto pronto para deploy na Vercel;

    código organizado e tipado;

    README claro;

    SQL executável;

    sem placeholders quebrados.

Forma de resposta esperada do Claude Code

Quero que você trabalhe como implementador prático.
Instruções de comportamento

    não responda apenas com sugestões genéricas;

    não entregue apenas pseudoarquitetura;

    gere os arquivos reais do projeto;

    quando precisar decidir algo, decida de forma sensata e siga em frente;

    explique brevemente decisões importantes, mas priorize implementação;

    sempre que possível, entregue código pronto;

    mantenha consistência entre schema, tipos, validações e UI;

    não simplifique demais a solução.

Antes de começar

Apresente rapidamente:

    a arquitetura escolhida;

    a estrutura de pastas;

    o plano de implementação em etapas curtas.

Depois disso, comece a criar a aplicação.
Instruções extras importantes

    use nomes de arquivos e pastas consistentes;

    evite dependências desnecessárias;

    prefira componentes acessíveis;

    trate estados vazios com cuidado;

    mantenha excelente legibilidade na tela ao vivo;

    prepare a base para futuras expansões, como múltiplos perfis, impressão, exportação e integrações;

    se houver ambiguidade em algum ponto menor, escolha a alternativa mais robusta e produtiva.

Pedido final

Agora crie a aplicação completa com base em tudo acima.
Não fique apenas descrevendo como faria.
Implemente de fato o projeto, gere os arquivos necessários e organize tudo para execução local e deploy na Vercel.