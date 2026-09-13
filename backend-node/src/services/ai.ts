import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
const anthropic = config.claudeApiKey ? new Anthropic({ apiKey: config.claudeApiKey }) : null;

export class AIService {
  private static async callGemini(prompt: string): Promise<string> {
    if (!genAI) throw new Error('Gemini API key not configured');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private static async callClaude(prompt: string): Promise<string> {
    if (!anthropic) throw new Error('Claude API key not configured');
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (msg.content[0] as any).text;
  }

  private static async generateWithFailover(prompt: string): Promise<{ text: string, source: 'gemini' | 'claude' | 'mock' }> {
    try {
      const text = await this.callGemini(prompt);
      return { text, source: 'gemini' };
    } catch (err) {
      console.warn('Gemini failed, falling back to Claude', err);
      try {
        const text = await this.callClaude(prompt);
        return { text, source: 'claude' };
      } catch (err2) {
        console.warn('Claude failed, falling back to Mock', err2);
        return { text: '', source: 'mock' };
      }
    }
  }

  static async getInsights(businessProfileId: string, period: string = 'month') {
    const prompt = `Generate realistic business insights for business ID ${businessProfileId} for the past ${period}. Focus on revenue trends, top products, and customer patterns. Return the output as plain text.`;
    const result = await this.generateWithFailover(prompt);

    if (result.source === 'mock') {
      result.text = `During this ${period}, revenue increased by 15% due to high demand for core products. Customer retention improved by 5%, indicating positive reception of recent loyalty initiatives. Consider stocking up on top-performing items to maintain growth.`;
    }

    return {
      insights: result.text.trim(),
      generated_by: result.source,
      generated_at: new Date().toISOString()
    };
  }

  static async getPredictions(businessProfileId: string, products: any[]) {
    const prompt = `Based on the following products data for business ID ${businessProfileId}: ${JSON.stringify(products)}, predict future demand and provide recommendations ('restock', 'keep', 'reduce'). Return ONLY a valid JSON array of objects with keys: product_id, product_name, predicted_demand (number), recommendation, confidence (0-1).`;
    const result = await this.generateWithFailover(prompt);

    let predictions = [];
    if (result.source === 'mock') {
      predictions = products.map(p => ({
        product_id: p.id,
        product_name: p.name,
        predicted_demand: p.sales_last_30d * 1.2,
        recommendation: p.stock_quantity < p.reorder_level ? 'restock' : 'keep',
        confidence: 0.85
      }));
    } else {
      try {
        const cleanedText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        predictions = JSON.parse(cleanedText);
      } catch (e) {
        console.error("Failed to parse AI response as JSON", e);
        predictions = products.map(p => ({
          product_id: p.id,
          product_name: p.name,
          predicted_demand: p.sales_last_30d * 1.2,
          recommendation: p.stock_quantity < p.reorder_level ? 'restock' : 'keep',
          confidence: 0.85
        }));
        result.source = 'mock';
      }
    }

    return {
      predictions,
      generated_by: result.source,
      generated_at: new Date().toISOString()
    };
  }

  static async getInvoiceAssist(businessProfileId: string, customerName?: string, items?: any[], context?: string) {
    const prompt = `Provide invoice suggestions for business ID ${businessProfileId}. Customer: ${customerName || 'Unknown'}, Items: ${JSON.stringify(items || [])}, Context: ${context || 'None'}. Suggest terms, missing fields, and auto-fill data. Return ONLY a valid JSON object with keys: terms (string), missing_fields (array of strings), auto_fill (object).`;
    const result = await this.generateWithFailover(prompt);

    let suggestions: any = {};
    if (result.source === 'mock') {
      suggestions = {
        terms: "Net 30 days. Late fee of 1.5% per month applies.",
        missing_fields: ["customer_email", "billing_address"],
        auto_fill: {
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      };
    } else {
      try {
        const cleanedText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        suggestions = JSON.parse(cleanedText);
      } catch (e) {
        console.error("Failed to parse AI response as JSON", e);
        suggestions = {
          terms: "Net 30 days. Late fee of 1.5% per month applies.",
          missing_fields: ["customer_email", "billing_address"],
          auto_fill: {
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        };
        result.source = 'mock';
      }
    }

    return {
      suggestions,
      generated_by: result.source,
      generated_at: new Date().toISOString()
    };
  }
}
