export const generate = async ({ system, prompt, temperature = 0.8 }) => {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'gpt-oss:20b';

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: false,
        options: {
          temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Parse json if output is json format, else just return the string
    let interpretation = data.response;
    try {
      const parsed = JSON.parse(data.response);
      if (parsed.interpretation) {
        interpretation = parsed.interpretation;
      }
    } catch (e) {
      // It's just plain text, continue
    }

    return interpretation.trim();
  } catch (error) {
    console.error('Ollama Service Error:', error.message);
    throw new Error('Vị thần đang im lặng. Hãy thử lại sau.');
  }
};
