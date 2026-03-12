import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar parâmetros da query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const negotiation_status = searchParams.get('negotiation_status')

    // Construir query base
    let query = supabase
      .from('approved_companies')
      .select(`
        *,
        negotiation_history(
          id,
          action_type,
          description,
          outcome,
          created_at
        ),
        ai_insights(
          id,
          insight_type,
          title,
          content,
          confidence_score,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (negotiation_status) {
      query = query.eq('negotiation_status', negotiation_status)
    }

    const { data: companies, error } = await query

    if (error) {
      console.error('Erro ao buscar empresas aprovadas:', error)
      return NextResponse.json({ error: 'Erro ao buscar empresas' }, { status: 500 })
    }

    // 2. Verificar quais possuem análise da IA
    const { data: analyses } = await supabase
      .from('company_analysis')
      .select('company_name')

    const analyzedCompanyNames = new Set(
      analyses?.map(a => a.company_name?.toLowerCase()).filter(Boolean)
    )

    // 3. Mesclar informação
    const companiesWithAnalysis = (companies || []).map(company => ({
      ...company,
      has_analysis: analyzedCompanyNames.has(company.company_name?.toLowerCase())
    }))

    return NextResponse.json({ companies: companiesWithAnalysis })
    
  } catch (error) {
    console.error('Erro na API de empresas aprovadas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('API POST /approved-companies received body:', JSON.stringify(body, null, 2));
    let { 
      company_id, 
      company_name, 
      ai_analysis, 
      strategy_generated, 
      website_analysis, 
      social_media_analysis, 
      market_analysis, 
      match_score, 
      skill_gaps,
      priority,
      website_url,
      linkedin_url,
      instagram_url,
      facebook_url,
      twitter_url
    } = body

    if (!company_id && !company_name) {
      console.error('API Error: Both company_id and company_name are missing');
      return NextResponse.json({ error: 'ID ou Nome da empresa é obrigatório' }, { status: 400 })
    }

    // Buscar informações da empresa (clients ou potential_clients)
    let companyData = null;
    let sourceTable = 'clients';

    const supabaseClient = supabase;

    // 1. Tentar buscar por ID
    if (company_id) {
      // Tentar na tabela clients
      const { data: compData } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('id', company_id)
        .single()
      
      if (compData) {
        companyData = compData;
        sourceTable = 'clients';
      } else {
        // Tentar na tabela potential_clients
        const { data: potData } = await supabaseClient
          .from('potential_clients')
          .select('*')
          .eq('id', company_id)
          .single()
        
        if (potData) {
          companyData = potData;
          sourceTable = 'potential_clients';
        }
      }
    }

    // 2. Se não encontrou por ID (ou sem ID), tentar por Nome
    if (!companyData && company_name) {
      // Tentar na tabela clients
      const { data: compData } = await supabaseClient
        .from('clients')
        .select('*')
        .ilike('company_name', company_name)
        .maybeSingle()
      
      if (compData) {
        companyData = compData;
        company_id = compData.id;
        sourceTable = 'clients';
      } else {
        // Tentar na tabela potential_clients
        const { data: potData } = await supabaseClient
          .from('potential_clients')
          .select('*')
          .ilike('company_name', company_name)
          .maybeSingle()
        
        if (potData) {
          companyData = potData;
          company_id = potData.id;
          sourceTable = 'potential_clients';
        }
      }
    }

    // Se não encontrou em nenhum lugar, vamos criar um novo Cliente
    if (!companyData) {
       console.log(`Empresa não encontrada: ID=${company_id}, Nome=${company_name}. Criando novo cliente.`);
       sourceTable = 'new_client';
    } else {
       console.log(`Empresa encontrada na tabela ${sourceTable}:`, companyData.id);
    }

    // Garantir que ai_analysis contenha todas as partes se fornecidas individualmente
    const final_ai_analysis = {
      ...(ai_analysis || {}),
      website: website_analysis || (ai_analysis?.website || {}),
      social: social_media_analysis || (ai_analysis?.social || {}),
      market_ads: market_analysis || (ai_analysis?.market_ads || {}),
      skill_gaps: skill_gaps || (ai_analysis?.skill_gaps || {})
    };

    // Preparar dados para approved_companies
    let baseCompanyData: any = {};
    let finalCompanyId = company_id;

    // Extrair URLs para colunas individuais (se existirem)
    const website_url_top = website_analysis?.url || website_url || companyData?.website || companyData?.full_company_data?.website_url;
    const linkedin_url_top = social_media_analysis?.platforms_data?.linkedin?.url || linkedin_url || companyData?.linkedin_url || companyData?.full_company_data?.linkedin?.url;
    const instagram_url_top = social_media_analysis?.platforms_data?.instagram?.url || instagram_url || companyData?.instagram_url || companyData?.full_company_data?.socialMedia?.instagram?.url;
    const facebook_url_top = social_media_analysis?.platforms_data?.facebook?.url || facebook_url || companyData?.facebook_url || companyData?.full_company_data?.socialMedia?.facebook?.url;
    const twitter_url_top = social_media_analysis?.platforms_data?.twitter?.url || twitter_url || companyData?.twitter_url || companyData?.full_company_data?.socialMedia?.twitter?.url;

    if (sourceTable === 'clients' && companyData) {
       baseCompanyData = {
          website_url: website_url_top,
          linkedin_url: linkedin_url_top,
          instagram_url: instagram_url_top,
          facebook_url: facebook_url_top,
          twitter_url: twitter_url_top,
          description: companyData.description || companyData.full_company_data?.description,
          industry: companyData.industry || companyData.full_company_data?.industry,
          size: companyData.size || companyData.full_company_data?.size,
       };
       finalCompanyId = companyData.id;
    } else if (sourceTable === 'potential_clients' && companyData) {
       // potential_clients
       const potFull = companyData.full_company_data || {};
       baseCompanyData = {
          website_url: website_url_top,
          linkedin_url: linkedin_url_top,
          instagram_url: instagram_url_top,
          facebook_url: facebook_url_top,
          twitter_url: twitter_url_top,
          description: companyData.description || potFull.description,
          industry: companyData.industry || potFull.industry,
          size: companyData.employee_count || potFull.employee_count,
       };

       // Promover para clients
       const newClientData = {
          company_name: companyData.company_name,
          status: 'client', // ou 'negotiating'
          priority: priority || 'medium',
          website_url: website_url_top,
          linkedin_url: linkedin_url_top,
          instagram_url: instagram_url_top,
          facebook_url: facebook_url_top,
          twitter_url: twitter_url_top,
          full_company_data: {
             ...baseCompanyData,
             ...potFull,
             // Já salvar análise se disponível
             ai_analysis: final_ai_analysis || {},
             strategy_generated: strategy_generated || {}
          }
       };

       const { data: newClient, error: createClientError } = await supabaseClient
          .from('clients')
          .insert([newClientData])
          .select()
          .single();
       
       if (createClientError) {
          console.error('Erro ao promover potential_client para client:', createClientError);
          return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
       }
       
       finalCompanyId = newClient.id;

       // Opcional: Atualizar status do potential_client para 'approved'
       await supabaseClient
          .from('potential_clients')
          .update({ status: 'approved' })
          .eq('id', companyData.id);

    } else {
       // Criar novo cliente do zero
       baseCompanyData = {
          website_url: website_url_top,
          linkedin_url: linkedin_url_top,
          instagram_url: instagram_url_top,
          facebook_url: facebook_url_top,
          twitter_url: twitter_url_top,
          // outros campos do payload
       };

       const newClientData = {
          company_name: company_name,
          status: 'client',
          priority: priority || 'medium',
          website_url: website_url_top,
          linkedin_url: linkedin_url_top,
          instagram_url: instagram_url_top,
          facebook_url: facebook_url_top,
          twitter_url: twitter_url_top,
          full_company_data: {
             website_url: website_url_top,
             ...website_analysis,
             ...social_media_analysis,
             market_analysis: market_analysis || {},
             ai_analysis: final_ai_analysis || {},
             strategy_generated: strategy_generated || {}
          }
       };

       const { data: newClient, error: createClientError } = await supabaseClient
          .from('clients')
          .insert([newClientData])
          .select()
          .single();
       
       if (createClientError) {
          console.error('Erro ao criar novo cliente:', createClientError);
          return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
       }
       
       finalCompanyId = newClient.id;
    }

    // Atualizar o cliente com os dados de aprovação (apenas se não acabou de criar, ou para garantir updates)
    // Mas se acabamos de criar, já temos os dados.
    // Vamos garantir que tudo esteja sincronizado.
    
    const currentFullData = companyData?.full_company_data || {};
    
    const updateData: any = {
      status: 'client', // Marcamos como cliente aprovado
      priority: priority || 'medium',
      website_url: website_url_top,
      linkedin_url: linkedin_url_top,
      instagram_url: instagram_url_top,
      facebook_url: facebook_url_top,
      twitter_url: twitter_url_top,
      full_company_data: {
        ...currentFullData,
        ...baseCompanyData,
        website_analysis: website_analysis || {},
        social_media_presence: social_media_analysis || {},
        market_analysis: market_analysis || {},
        skill_gaps: skill_gaps || {},
        // Campos extras que estariam em approved_companies
        negotiation_status: 'iniciado',
        match_score: match_score || 0,
        ai_analysis: final_ai_analysis || {},
        strategy_generated: strategy_generated || {}
      }
    };

    const { data: updatedClient, error: updateError } = await supabaseClient
      .from('clients')
      .update(updateData)
      .eq('id', finalCompanyId)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar cliente:', updateError);
      return NextResponse.json({ error: 'Erro ao aprovar cliente' }, { status: 500 });
    }

    // Criar entrada em company_analysis para o Painel IA
    try {
      const companyAnalysisData = {
        related_client_id: finalCompanyId,
        user_profile_id: user.id,
        company_name: company_name || updatedClient.company_name,
        website_analysis: website_analysis || (final_ai_analysis?.website || {}),
        social_media_presence: social_media_analysis || (final_ai_analysis?.social || {}),
        market_analysis: market_analysis || (final_ai_analysis?.market_ads || {}),
        skill_gaps: skill_gaps || (final_ai_analysis?.skill_gaps || {}),
        strategy_generated: strategy_generated || (final_ai_analysis?.strategy || {}),
        status: 'completed'
      };

      const { error: analysisError } = await supabase
        .from('company_analysis')
        .insert([companyAnalysisData]);

      if (analysisError) {
        console.error('Erro ao criar registro em company_analysis:', analysisError);
      } else {
        console.log('Registro em company_analysis criado com sucesso para o cliente:', finalCompanyId);
      }
    } catch (e) {
      console.error('Erro ao tentar inserir em company_analysis:', e);
    }

    // Criar ou atualizar registro em approved_companies para vincular ao usuário
    try {
      const approvedData = {
        user_id: user.id,
        company_id: finalCompanyId,
        company_name: company_name || updatedClient.company_name,
        website_url: website_url_top,
        linkedin_url: linkedin_url_top,
        instagram_url: instagram_url_top,
        facebook_url: facebook_url_top,
        twitter_url: twitter_url_top,
        full_company_data: updatedClient.full_company_data,
        ai_analysis: final_ai_analysis || {},
        strategy_generated: strategy_generated || {},
        match_score: match_score || 0,
        status: 'novo', 
        negotiation_status: 'iniciado',
        priority: priority || 'medium'
      };

      const { error: approvedError } = await supabase
        .from('approved_companies')
        .upsert(approvedData, { onConflict: 'user_id, company_id' });

      if (approvedError) {
        console.error('Erro ao vincular empresa ao usuário (approved_companies):', approvedError);
        // Não vamos falhar a requisição inteira se apenas o vínculo falhar, mas é bom logar
      }
    } catch (e) {
      console.warn('Tabela approved_companies não existe ou erro ao inserir (ignorado):', e);
    }

    // Tentar criar insight apenas se a tabela existir (ignorar erro se não existir)
    try {
      const insightData = {
        approved_company_id: finalCompanyId, // Usando ID do cliente como referência
        user_id: user.id,
        insight_type: 'analysis',
        title: 'Empresa Aprovada para Processo',
        content: `Empresa ${company_name} foi aprovada para processo de negociação com score de match ${match_score || 0}%. Análise completa disponível.`,
        confidence_score: 85,
        context_data: {
          match_score: match_score || 0,
          analysis_type: 'approval',
          company_data: updatedClient
        }
      }
      await supabase.from('ai_insights').insert([insightData]);
    } catch (e) {
      console.warn('Tabela ai_insights não existe ou erro ao inserir (ignorado):', e);
    }

    // Tentar atualizar memória apenas se tabela existir
    try {
      await supabase
        .from('ai_search_memory')
        .update({ 
          status: 'interested',
          feedback_notes: `Aprovada em ${new Date().toLocaleDateString('pt-BR')} com score ${match_score || 0}%`,
          last_discovered_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('company_name', company_name)
    } catch (e) {
       console.warn('Erro ao atualizar ai_search_memory (ignorado):', e);
    }

    return NextResponse.json({ 
      success: true, 
      company: updatedClient,
      message: 'Empresa aprovada com sucesso'
    })
    
  } catch (error) {
    console.error('Erro na API de aprovação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}


export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, negotiation_status, priority, negotiation_value, next_action_date, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Atualizar empresa aprovada
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (negotiation_status) updateData.negotiation_status = negotiation_status
    if (priority) updateData.priority = priority
    if (negotiation_value) updateData.negotiation_value = negotiation_value
    if (next_action_date) updateData.next_action_date = next_action_date
    if (notes) updateData.notes = notes

    // Atualizar datas de contato
    if (negotiation_status === 'contato_realizado') {
      updateData.last_contact_date = new Date().toISOString()
      if (!updateData.first_contact_date) {
        updateData.first_contact_date = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('approved_companies')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar empresa:', error)
      return NextResponse.json({ error: 'Erro ao atualizar empresa' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      company: data,
      message: 'Empresa atualizada com sucesso'
    })
    
  } catch (error) {
    console.error('Erro na API de atualização:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}