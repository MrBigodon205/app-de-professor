export interface AiPlanResponse {
    title: string;
    theme_area: string;
    duration: string;
    objectives: string;
    bncc_codes: string;
    content_description: string;
    methodology: string;
    resources: string;
    assessment: string;
}

export const generateLessonPlan = async (topic: string, apiKey: string): Promise<AiPlanResponse> => {
    const prompt = `
    Gere um plano de aula completo em formato JSON para o tema "${topic}" voltado para o Ensino Fundamental/Médio.
    Retorne APENAS o JSON válido, sem markdown, sem explicações.
    Estrutura obrigatória:
    {
        "title": "Título Criativo",
        "theme_area": "Área (ex: Ciências)",
        "duration": "Duração (ex: 2 aulas)",
        "objectives": "HTML string: <ul><li>Obj 1</li>...</ul>",
        "bncc_codes": "Códigos (ex: EF01CI01)",
        "content_description": "Resumo em HTML simples (<p>...)",
        "methodology": "Passo a passo em HTML (<ol><li>...)",
        "resources": "Lista de materiais",
        "assessment": "Forma de avaliação"
    }
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Erro na API do Gemini');
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("A IA não retornou conteúdo.");

        // Clean markdown code blocks if present
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson) as AiPlanResponse;

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
