// Test script to verify AI Analysis Service is working
import AIAnalysisService from '../services/ai-analysis-browser';

const testAIAnalysis = async () => {
  const aiService = new AIAnalysisService('gemini-2.5-pro');
  
  const sessionContext = {
    recentActions: [],
    browserState: 'idle' as const
  };

  try {
    console.log('Testing AI Analysis Service...');
    
    // Test 1: Browser Task
    const browserTest = await aiService.analyzeUserInput('search for AI news', sessionContext);
    console.log('Browser Task Analysis:', browserTest);
    
    // Test 2: App Task
    const appTest = await aiService.analyzeUserInput('add task buy groceries', sessionContext);
    console.log('App Task Analysis:', appTest);
    
    // Test 3: Conversation
    const conversationTest = await aiService.analyzeUserInput('what can you do?', sessionContext);
    console.log('Conversation Analysis:', conversationTest);
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('AI Analysis Test Failed:', error);
  }
};

// Export for use in development
export default testAIAnalysis;
