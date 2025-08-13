import { parseCv } from './cvParser.js';
import { loadCursos } from '../data/dataLoader.js';
<<<<<<< HEAD
import { jobDataService } from './jobDataService.js';
import { extrairCompetencias, realizarAnalise } from './geminiClient.js';
=======
import { extrairCompetencias, realizarAnalise, gerarRoadmapEstrategico } from './geminiClient.js';
import { buscarVagasJSearch, extrairCompetenciasVagas } from './jsearchService.js';
import courseIntegrationService from './courseIntegrationService.js';
>>>>>>> c43b4f1d052195e7a05d5be39626520da82609ff

function extrairCompetenciasMaisComuns(vagas, cargoAlmejado, topN = 10) {
    console.log('🔍 Extraindo competências para cargo:', cargoAlmejado);
    console.log('📊 Total de vagas carregadas:', vagas.length);

    const competenciasCount = {};
    vagas.forEach(vaga => {
        if (
            vaga.cargo && vaga.cargo.toLowerCase().includes(cargoAlmejado.toLowerCase()) && Array.isArray(vaga.competencias)
        ) {
            vaga.competencias.forEach(comp => {
                competenciasCount[comp] = (competenciasCount[comp] || 0) + 1;
            });
        }
    });

    const competenciasOrdenadas = Object.entries(competenciasCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([comp]) => comp);

    console.log('📈 Competências mais comuns encontradas:', competenciasOrdenadas);
    return competenciasOrdenadas;
}

/**
 * FASE 4: GERAÇÃO DE ROADMAP ESTRATÉGICO - Implementação da metodologia
 * Segue a metodologia definida em metodologia.md
 */
async function sugerirCursosIntegrado(pontosADesenvolver, cargoAlmejado, pontosFortes) {
    console.log('🎯 FASE 4: Iniciando Geração de Roadmap Estratégico');
    console.log('📚 Total de pontos a desenvolver:', pontosADesenvolver.length);

    try {
        // Primeiro, usar o CourseIntegrationService para obter cursos disponíveis
        console.log('🔍 Buscando cursos disponíveis via CourseIntegrationService...');
        const roadmapEnriquecido = await courseIntegrationService.generateEnrichedRoadmap(
            pontosADesenvolver,
            cargoAlmejado
        );

        console.log('✅ Cursos obtidos via CourseIntegrationService');
        console.log(`📊 Total de cursos mapeados: ${roadmapEnriquecido.metadata.total_cursos}`);
        console.log(`🔍 Fonte dos cursos: ${roadmapEnriquecido.metadata.fonte_cursos}`);

        // Preparar dados para o Gemini
        const diagnosticoJson = {
            pontos_fortes: pontosFortes || [],
            pontos_a_desenvolver: roadmapEnriquecido.pontos_a_desenvolver
        };

        // Preparar cursos disponíveis para o Gemini
        const cursosDisponiveisJson = {
            total_cursos: roadmapEnriquecido.metadata.total_cursos,
            categorias: roadmapEnriquecido.metadata.categorias || [],
            cursos_por_competencia: roadmapEnriquecido.pontos_a_desenvolver.map(ponto => ({
                competencia: ponto.competencia,
                cursos_disponiveis: ponto.cursos_sugeridos || []
            }))
        };

        console.log('🤖 Gerando roadmap estratégico via Gemini...');
        console.log('📤 Dados enviados para o Gemini:');
        console.log('   - Diagnóstico JSON:', JSON.stringify(diagnosticoJson, null, 2));
        console.log('   - Cursos disponíveis JSON:', JSON.stringify(cursosDisponiveisJson, null, 2));

        const roadmapEstrategico = await gerarRoadmapEstrategico(
            cargoAlmejado,
            diagnosticoJson,
            cursosDisponiveisJson
        );

        console.log('✅ Roadmap estratégico gerado via Gemini');
        console.log('📋 Resposta completa do Gemini:');
        console.log('   - Estrutura da resposta:', Object.keys(roadmapEstrategico));
        console.log('   - Roadmap array:', roadmapEstrategico.roadmap ? 'SIM' : 'NÃO');
        console.log(`   - Total de passos no roadmap: ${roadmapEstrategico.roadmap?.length || 0}`);

        if (roadmapEstrategico.roadmap && roadmapEstrategico.roadmap.length > 0) {
            console.log('   - Primeiro passo:', JSON.stringify(roadmapEstrategico.roadmap[0], null, 2));
            console.log('   - Último passo:', JSON.stringify(roadmapEstrategico.roadmap[roadmapEstrategico.roadmap.length - 1], null, 2));
        }

        // Retornar o roadmap estruturado do Gemini
        return roadmapEstrategico.roadmap || [];

    } catch (error) {
        console.error('❌ Erro na geração do roadmap estratégico:', error);
        console.log('🔄 Usando fallback para sugestão de cursos...');

        // Fallback para o método antigo
        return pontosADesenvolver.map(ponto => ({
            ...ponto,
            cursos_sugeridos: [],
            total_cursos: 0,
            prioridade: 50
        }));
    }
}

export async function gerarRoadmapCompleto(arquivoCV, cargoAlmejado) {
    try {
        console.log('🔍 Iniciando extração do texto do CV...');
        const textoCV = await parseCv(arquivoCV);
        console.log('📄 Texto extraído do CV:', textoCV ? textoCV.substring(0, 200) + '...' : 'NULO');

<<<<<<< HEAD
        console.log('📂 Carregando dados de vagas...');
        const vagas = await jobDataService.loadVagas();
        console.log('✅ Vagas carregadas:', vagas.length);
=======
        console.log('🔍 Buscando vagas reais via JSearch...');
        let vagas = [];
        let fonteDados = 'estática';

        try {
            // Usar apenas 3 vagas para economizar a cota da API
            vagas = await buscarVagasJSearch(cargoAlmejado, 'Brazil', 3);
            console.log('✅ Vagas do JSearch carregadas:', vagas.length);

            // Verificar se as vagas são relevantes para o cargo
            const vagasRelevantes = vagas.filter(vaga =>
                vaga.titulo.toLowerCase().includes('developer') ||
                vaga.titulo.toLowerCase().includes('engineer') ||
                vaga.titulo.toLowerCase().includes('programmer') ||
                vaga.titulo.toLowerCase().includes('analyst') ||
                vaga.titulo.toLowerCase().includes('manager') ||
                vaga.titulo.toLowerCase().includes('designer')
            );

            if (vagasRelevantes.length > 0) {
                vagas = vagasRelevantes;
                fonteDados = 'JSearch';
                console.log(`✅ Encontradas ${vagasRelevantes.length} vagas relevantes do JSearch`);
            } else {
                console.log(`⚠️ Vagas do JSearch não são relevantes para ${cargoAlmejado}`);
                vagas = [];
            }
        } catch (error) {
            console.log('⚠️ Erro ao buscar vagas do JSearch, usando dados estáticos:', error.message);
            vagas = [];
        }

        // Definir competências do mercado baseado no que foi extraído anteriormente
        let competenciasMercado;
        if (vagas.length > 0) {
            // Usar competências extraídas do JSearch
            console.log('🤖 Extraindo competências das vagas do JSearch...');
            const analiseMercado = await extrairCompetenciasVagas(vagas);
            console.log('✅ Análise de mercado do JSearch:', analiseMercado);

            const competenciasJSearch = analiseMercado.competencias_principais || [];
            const competenciasVagas = extrairCompetenciasMaisComuns(vagas, cargoAlmejado, 15);

            // Combinar e remover duplicatas
            competenciasMercado = [...new Set([...competenciasJSearch, ...competenciasVagas])];
            console.log('✅ Competências do mercado (JSearch):', competenciasMercado);
        } else {
            // Fallback para dados estáticos
            console.log('⚠️ Nenhuma vaga encontrada, usando dados estáticos como fallback...');
            const { loadVagas } = await import('../data/dataLoader.js');
            const vagasEstaticas = await loadVagas();
            competenciasMercado = extrairCompetenciasMaisComuns(vagasEstaticas, cargoAlmejado);
            console.log('✅ Competências do mercado (estáticas):', competenciasMercado);
        }
>>>>>>> c43b4f1d052195e7a05d5be39626520da82609ff

        console.log('📂 Carregando dados de cursos...');
        const cursos = await loadCursos();
        console.log('✅ Cursos carregados:', cursos.length);

        console.log('🤖 Extraindo competências via IA...');
        console.log('📄 Texto do CV enviado para extração:', textoCV ? textoCV.substring(0, 300) + '...' : 'NULO');

        const competenciasUsuario = await extrairCompetencias(textoCV);

        console.log('✅ Competências do usuário extraídas pelo Gemini:');
        console.log('   - Estrutura da resposta:', Object.keys(competenciasUsuario));
        console.log('   - Hard skills:', JSON.stringify(competenciasUsuario.hard_skills, null, 2));
        console.log('   - Soft skills:', JSON.stringify(competenciasUsuario.soft_skills, null, 2));
        console.log('   - Total de hard skills:', competenciasUsuario.hard_skills?.length || 0);
        console.log('   - Total de soft skills:', competenciasUsuario.soft_skills?.length || 0);

        console.log('✅ Competências do mercado:', competenciasMercado);

        console.log('🤖 Realizando análise de lacunas...');
        console.log('📊 Dados enviados para o Gemini:');
        console.log('   - Competências do usuário:', JSON.stringify(competenciasUsuario, null, 2));
        console.log('   - Competências do mercado:', JSON.stringify(competenciasMercado, null, 2));
        console.log('   - Cargo almejado:', cargoAlmejado);

        const analise = await realizarAnalise(competenciasUsuario, competenciasMercado, cargoAlmejado);

        console.log('✅ Análise do Gemini concluída');
        console.log('📋 Resposta completa do Gemini:');
        console.log('   - Pontos fortes:', JSON.stringify(analise.pontos_fortes, null, 2));
        console.log('   - Pontos a desenvolver:', JSON.stringify(analise.pontos_a_desenvolver, null, 2));
        console.log('   - Estrutura da resposta:', Object.keys(analise));
        console.log('   - Total de pontos fortes:', analise.pontos_fortes?.length || 0);
        console.log('   - Total de lacunas:', analise.pontos_a_desenvolver?.length || 0);

        // FASE 4: Geração de Roadmap Estratégico
        console.log('🎯 Iniciando Fase 4: Geração de Roadmap Estratégico...');
        console.log('📊 Dados para geração do roadmap:');
        console.log('   - Pontos a desenvolver:', JSON.stringify(analise.pontos_a_desenvolver, null, 2));
        console.log('   - Pontos fortes:', JSON.stringify(analise.pontos_fortes, null, 2));
        console.log('   - Cargo almejado:', cargoAlmejado);

        const roadmapEstrategico = await sugerirCursosIntegrado(analise.pontos_a_desenvolver, cargoAlmejado, analise.pontos_fortes);

        console.log('✅ Roadmap estratégico concluído');
        console.log('📋 Resultado do roadmap estratégico:');
        console.log('   - Estrutura da resposta:', Object.keys(roadmapEstrategico));
        console.log('   - Total de passos:', roadmapEstrategico?.length || 0);
        if (roadmapEstrategico && roadmapEstrategico.length > 0) {
            console.log('   - Primeiro passo:', JSON.stringify(roadmapEstrategico[0], null, 2));
        }

        const roadmap = {
            cargo_almejado: cargoAlmejado,
            pontos_fortes: analise.pontos_fortes,
            pontos_a_desenvolver: analise.pontos_a_desenvolver, // Manter análise original
            roadmap_estrategico: roadmapEstrategico, // Novo campo com roadmap estruturado
            texto_cv: textoCV,
            vagas_mercado: vagas.slice(0, 10), // Incluir top 10 vagas encontradas
            total_vagas_analisadas: vagas.length,
            fonte_dados: fonteDados,
            // Metadados sobre cursos (Fase 4 da metodologia)
            cursos_metadata: {
                total_lacunas: analise.pontos_a_desenvolver.length,
                fonte_cursos: 'integrated_service',
                timestamp: new Date().toISOString()
            }
        };
        console.log('✅ Roadmap gerado com texto_cv:', roadmap.texto_cv ? 'SIM' : 'NÃO');
        console.log('🎉 RESUMO FINAL DA ANÁLISE:');
        console.log('   - Cargo almejado:', roadmap.cargo_almejado);
        console.log('   - Total de pontos fortes:', roadmap.pontos_fortes?.length || 0);
        console.log('   - Total de lacunas:', roadmap.pontos_a_desenvolver?.length || 0);
        console.log('   - Roadmap estratégico gerado:', roadmap.roadmap_estrategico ? 'SIM' : 'NÃO');
        console.log('   - Passos no roadmap:', roadmap.roadmap_estrategico?.length || 0);
        console.log('   - Fonte dos dados de vagas:', roadmap.fonte_dados);
        console.log('   - Total de vagas analisadas:', roadmap.total_vagas_analisadas);
        console.log('   - Timestamp:', new Date().toISOString());
        console.log('='.repeat(80));

        return roadmap;
    } catch (error) {
        console.error('❌ Erro em gerarRoadmapCompleto:', error);
        throw error;
    }
} 