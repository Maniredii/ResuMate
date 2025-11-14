import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function listGeminiModels() {
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    console.log('Available Gemini Models:\n');
    
    const models = response.data.models.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    );
    
    models.forEach(model => {
      console.log(`Name: ${model.name}`);
      console.log(`Display Name: ${model.displayName}`);
      console.log(`Description: ${model.description}`);
      console.log(`Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listGeminiModels();
