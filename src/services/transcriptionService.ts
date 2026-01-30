
export interface TranscriptionResponse {
    text: string;
}

export const TranscriptionService = {
    transcribe: async (audioBlob: Blob, model: string, apiKey: string): Promise<TranscriptionResponse> => {
        const formData = new FormData();
        const extension = audioBlob.type.includes("webm") ? "webm" : "wav";
        formData.append("file", audioBlob, `audio.${extension}`);
        formData.append("model", model);
        formData.append("language", "es"); // Force Spanish
        formData.append("temperature", "0"); // Limit hallucinations
        formData.append(
            "prompt",
            "Transcribe el audio en español de forma fiel. Elimina únicamente repeticiones accidentales inmediatas (por ejemplo 'hola hola') y ruidos evidentes. No reformules frases ni agregues contenido. Mantén la estructura original del discurso."
        );

        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Error traversing Groq API");
        }

        return await response.json();
    }
};
