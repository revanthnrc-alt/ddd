import { GoogleGenAI, Type } from '@google/genai';
import React, { useState, useContext, createContext, useEffect } from 'react';
import {
  RedTeamScenario,
  AttackLog,
  BluePatch,
  SocialFeedPost,
  AnalysisResult,
  GeoCodeResult,
  MapPoint,
  AnalysisResultItem,
} from '../types';

// --- GEMINI SETUP ---
// This is a global variable that will hold the Gemini AI client.
let ai: GoogleGenAI | null = null;
try {
  if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using mock mode exclusively.");
  } else {
    // Fix: Correctly initialize GoogleGenAI
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenAI. API_KEY might be missing or invalid.", e);
}


// --- MOCK DATABASE ---
// A simple in-memory key-value store to simulate a database.
class MockDBStore<T extends { id: string | number }> {
  private store = new Map<string | number, T>();
  constructor(initialData: T[] = []) {
    initialData.forEach(item => this.store.set(item.id, item));
  }
  add(item: T) { this.store.set(item.id, item); }
  get(): T[] { return Array.from(this.store.values()); }
  pop(): T | undefined {
    const values = this.get();
    if (values.length === 0) return undefined;
    const lastItem = values[values.length - 1];
    this.store.delete(lastItem.id);
    return lastItem;
  }
  clear() { this.store.clear(); }
  some(predicate: (value: T, index: number, array: T[]) => unknown): boolean {
    return this.get().some(predicate);
  }
}

// --- MOCK DATA & STATE ---
const SCENARIOS: RedTeamScenario[] = [
  {
    id: 'relay_attack_wagah',
    name: 'Wagah Border Relay Attack',
    description: 'A two-person team uses a package handoff to bypass perimeter security.',
    event_sequence: [
        { entity_id: 'OPERATIVE_A', action: 'enter', timestamp_offset_seconds: 0, coords: [31.6035, 74.5715], path: [[31.6035, 74.5715], [31.6042, 74.5728]], metadata: {} },
        { entity_id: 'OPERATIVE_A', action: 'move', timestamp_offset_seconds: 5, coords: [31.6042, 74.5728], metadata: {} },
        { entity_id: 'OPERATIVE_A', action: 'drop_package', timestamp_offset_seconds: 6, coords: [31.6042, 74.5728], metadata: { detection_status: 'PENDING' } },
        { entity_id: 'OPERATIVE_B', action: 'enter', timestamp_offset_seconds: 7, coords: [31.6052, 74.5742], path: [[31.6052, 74.5742], [31.6042, 74.5728]], metadata: {} },
        { entity_id: 'OPERATIVE_A', action: 'exit', timestamp_offset_seconds: 8, coords: [31.6038, 74.5718], metadata: {} },
        { entity_id: 'OPERATIVE_B', action: 'move', timestamp_offset_seconds: 12, coords: [31.6042, 74.5728], metadata: {} },
        { entity_id: 'OPERATIVE_B', action: 'pickup_package', timestamp_offset_seconds: 13, coords: [31.6042, 74.5728], metadata: { detection_status: 'BYPASSED' } },
        { entity_id: 'OPERATIVE_B', action: 'exit', timestamp_offset_seconds: 18, coords: [31.6048, 74.5748], metadata: {} },
    ]
  },
];

const SOCIAL_FEED_POSTS_POOL: SocialFeedPost[] = [
    { post_id: 'tw_1', source: 'twitter', text: "Big convoy protest planned near Wagah next week. Going to be huge! #FarmersProtest", timestamp: new Date().toISOString(), user: 'protest_tracker', raw_location: 'Wagah Border', lang: 'en' },
    { post_id: 'tg_1', source: 'telegram', text: "Need to get a special package across. Standard routes are too hot. Any ideas for the Wagah area?", timestamp: new Date().toISOString(), user: 'anon_smuggler', raw_location: 'Amritsar', lang: 'en' },
    { post_id: 'rd_1', source: 'reddit', text: "Does anyone know if the new drone surveillance at the border can be bypassed easily?", timestamp: new Date().toISOString(), user: 'curious_cat', raw_location: 'Lahore', lang: 'en' },
    { post_id: 'nw_1', source: 'news', text: "Authorities increase security measures at the Wagah border crossing ahead of the holiday season.", timestamp: new Date().toISOString(), user: 'border_news', raw_location: 'Wagah, Punjab', lang: 'en' },
    { post_id: 'pa_1', source: 'twitter', text: "ਸਰਹੱਦ 'ਤੇ ਵੱਡਾ ਇਕੱਠ ਹੋਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ। ਸਾਰੇ ਤਿਆਰ ਰਹੋ।", timestamp: new Date().toISOString(), user: 'punjabi_activist', raw_location: 'Tarn Taran', lang: 'pa'}, // "Big gathering is expected at the border. Everyone be ready."
    { post_id: 'hi_1', source: 'twitter', text: "वाघा पर घेराव की योजना बन रही है। सरकार को हमारी बात सुननी होगी।", timestamp: new Date().toISOString(), user: 'kisan_union_delhi', raw_location: 'Wagah', lang: 'hi'} // "A blockade is being planned at Wagah. The government will have to listen to us."
];

// --- MOCK MODE MANAGEMENT ---
let _isMockMode_global = true;
const mockModeListeners = new Set<() => void>();
const toggleMockMode_global = () => {
    _isMockMode_global = !_isMockMode_global;
    mockModeListeners.forEach(cb => cb());
};

export const useMockMode = () => {
    const [isMock, setIsMock] = useState(_isMockMode_global);
    useEffect(() => {
        const listener = () => setIsMock(_isMockMode_global);
        mockModeListeners.add(listener);
        return () => mockModeListeners.delete(listener);
    }, []);
    return { isMockMode: isMock, toggleMockMode: toggleMockMode_global };
};

// --- API CLIENT ---
const dispatchApiCall = (endpoint: string, status: 'MOCK' | 'LIVE' | 'ERROR') => {
  window.dispatchEvent(new CustomEvent('api-call', { detail: { endpoint, status } }));
};

class BackendClient {
  private _isOnline = true;
  private geocodeIndex: Record<string, { lat: number; lon: number }> | null = null;
  private geocodeIndexPromise: Promise<void> | null = null;
  db = {
    attackLogs: new MockDBStore<AttackLog>(),
    rules: new MockDBStore<{id: string, [key: string]: any}>(),
    socialFlags: new MockDBStore<{id: string, location: string}>([
        {id: 'flag_01', location: 'Wagah Border'}
    ]),
  };

  constructor() {
    this._isOnline = navigator.onLine;
    window.addEventListener('online', () => this._isOnline = true);
    window.addEventListener('offline', () => this._isOnline = false);
    this._initialize(); // Start initialization
  }

  private _initialize() {
    // This pattern ensures we only fetch the file once.
    this.geocodeIndexPromise = (async () => {
      try {
        const response = await fetch('/sample_data/geocode_index.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        this.geocodeIndex = await response.json();
      } catch (error) {
        console.error("Could not load geocode index:", error);
      }
    })();
  }

  isOnline = () => this._isOnline;
  
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async getScenarios(): Promise<RedTeamScenario[]> {
    await this.delay(300);
    dispatchApiCall('getScenarios', 'MOCK');
    return SCENARIOS;
  }
  
  async runSimulation(scenarioId: string): Promise<{ event_sequence: any[], attack_log_id: string }> {
    await this.delay(1000);
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) throw new Error("Scenario not found");

    const newLogId = `log_${Date.now()}`;
    const appliedRules = this.db.rules.get();
    let events = JSON.parse(JSON.stringify(scenario.event_sequence));

    if (appliedRules.some(r => r.id === 'stateful_handoff_v2')) {
      const pickupEvent = events.find((e: any) => e.action === 'pickup_package');
      if (pickupEvent) pickupEvent.metadata.detection_status = 'DETECTED';
    }

    dispatchApiCall('runSimulation', 'MOCK');
    return { event_sequence: events, attack_log_id: newLogId };
  }

  async generateBluePatch(lastLog: AttackLog): Promise<BluePatch> {
    if (!_isMockMode_global && ai) {
        dispatchApiCall('generateBluePatch', 'LIVE');
        try {
            const model = "gemini-2.5-flash";
            const prompt = `
            Analyze the following security event log and generate a new detection rule.
            The attack involves two operatives coordinating a package handoff inside a sensitive zone to bypass detection.
            Operative A drops a package, and Operative B picks it up shortly after. This "relay" is the vulnerability.
            
            Log: ${JSON.stringify(lastLog.events.map(e => `${e.entity} ${e.action} at ${e.details}`), null, 2)}

            Generate a rule that detects if a 'drop_package' event is followed by a 'pickup_package' event for the *same package* by a *different entity* within a short time (e.g., 60 seconds) in the same zone.
            
            Provide your response as a JSON object with two keys:
            1. "patch_text": A natural language description of the rule.
            2. "patch_json": A machine-readable JSON object for the rule with keys "rule_id", "description", "trigger", and "action". Use "stateful_handoff_v2" as the rule_id.
            `;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    patch_text: { type: Type.STRING },
                    patch_json: {
                        type: Type.OBJECT,
                        properties: {
                            rule_id: { type: Type.STRING },
                            description: { type: Type.STRING },
                            trigger: { type: Type.OBJECT },
                            action: { type: Type.STRING }
                        },
                        required: ["rule_id", "description", "trigger", "action"]
                    }
                },
                required: ["patch_text", "patch_json"]
            };

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema,
                }
            });
            
            const result = JSON.parse(response.text);
            return {
                patch_id: `patch_${Date.now()}`,
                ...result,
            };
        } catch (error) {
            console.error("Gemini API call failed for generateBluePatch:", error);
            dispatchApiCall('generateBluePatch', 'ERROR');
        }
    }
    
    dispatchApiCall('generateBluePatch', 'MOCK');
    await this.delay(1500);
    return {
      patch_id: `patch_${Date.now()}`,
      patch_text: "New rule: Detect and flag if a package is picked up by a different entity than the one who dropped it within the same zone in under 60 seconds.",
      patch_json: {
        rule_id: "stateful_handoff_v2",
        description: "Detects suspicious package handoffs between entities.",
        trigger: {
          type: "sequence",
          events: ["drop_package", "pickup_package"],
          conditions: [
            "event1.zone === event2.zone",
            "event1.entity_id !== event2.entity_id",
            "event2.timestamp - event1.timestamp < 60"
          ]
        },
        action: "CREATE_CRITICAL_ALERT"
      }
    };
  }

  async applyRule(patch_json: Record<string, any>): Promise<void> {
    await this.delay(500);
    this.db.rules.add({ id: patch_json.rule_id, ...patch_json });
    dispatchApiCall('applyRule', 'MOCK');
  }

  async getFeedStream(): Promise<SocialFeedPost[]> {
      await this.delay(500);
      const count = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...SOCIAL_FEED_POSTS_POOL].sort(() => 0.5 - Math.random());
      dispatchApiCall('getFeedStream', 'MOCK');
      return shuffled.slice(0, count).map(p => ({...p, post_id: `${p.post_id.split('_')[0]}_${Date.now()}_${Math.random()}`}));
  }

  async analyzePosts(posts: SocialFeedPost[]): Promise<AnalysisResult> {
    if (!_isMockMode_global && ai && posts.length > 0) {
        dispatchApiCall('analyzePosts', 'LIVE');
        try {
            const model = 'gemini-2.5-flash';
            const prompt = `
            You are a security AI. Analyze these social media posts for threats near the India-Pakistan border, especially the Wagah area.
            Keywords to look for: protest, smuggle, convoy, package, blockade, Wagah, घेराव.
            For each post, determine a threat level ('none', 'warning', 'critical') and provide a brief summary if a threat exists.
            Also, generate map points for credible threat locations.
            
            Posts:
            ${JSON.stringify(posts.map(p => ({id: p.post_id, text: p.text, location: p.raw_location})), null, 2)}
            
            Return a single JSON object.
            `;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    results: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                post_id: { type: Type.STRING },
                                threat_level: { type: Type.STRING, enum: ['none', 'warning', 'critical'] },
                                confidence: { type: Type.NUMBER },
                                locations: { type: Type.ARRAY, items: { type: Type.STRING } },
                                summary: { type: Type.STRING }
                            },
                            required: ['post_id', 'threat_level', 'confidence', 'locations', 'summary']
                        }
                    },
                    map_points: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                coords: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                                intensity: { type: Type.NUMBER },
                                label: { type: Type.STRING }
                            },
                             required: ['coords', 'intensity', 'label']
                        }
                    }
                },
                required: ['results', 'map_points']
            };

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                }
            });
            return JSON.parse(response.text);
        } catch(error) {
            console.error("Gemini API call failed for analyzePosts:", error);
            dispatchApiCall('analyzePosts', 'ERROR');
        }
    }

    dispatchApiCall('analyzePosts', 'MOCK');
    await this.delay(1200);
    const results: AnalysisResultItem[] = [];
    const map_points: MapPoint[] = [];

    posts.forEach(post => {
        let threat_level: 'none' | 'warning' | 'critical' = 'none';
        let summary = "No immediate threat identified.";
        const text = post.text.toLowerCase();
        if (text.includes('protest') || text.includes('घेराव') || text.includes('blockade')) {
            threat_level = 'critical';
            summary = "Potential for civil unrest and blockade at a major crossing.";
            if (!map_points.some(p => p.label === 'Wagah Border Crossing')) {
                map_points.push({ coords: [31.6047, 74.5725], intensity: 0.8, label: 'Wagah Border Crossing' });
            }
        } else if (text.includes('package') || text.includes('smuggle')) {
            threat_level = 'warning';
            summary = "Chatter related to illicit package transfer detected.";
        }
        
        results.push({
            post_id: post.post_id,
            threat_level,
            confidence: Math.random() * 0.3 + 0.65,
            locations: [post.raw_location],
            summary,
        });
    });

    return { results, map_points };
  }
  
  async geocodeLocation(location: string): Promise<GeoCodeResult | null> {
    await this.delay(50);
    dispatchApiCall('geocodeLocation', 'MOCK');

    // Ensure the index is loaded before proceeding.
    if (this.geocodeIndexPromise) {
      await this.geocodeIndexPromise;
    }

    if (!this.geocodeIndex) {
        console.warn("Geocode index is not available.");
        return null;
    }
    
    const loc = location.toLowerCase();

    // Find the first key in our index that is a substring of the raw location.
    const locationKey = Object.keys(this.geocodeIndex).find(key => key !== 'default' && loc.includes(key));

    if (locationKey && this.geocodeIndex[locationKey]) {
      return this.geocodeIndex[locationKey];
    }
    
    // Fallback to default if it exists
    return this.geocodeIndex['default'] || null;
  }
  
  async translateText(text: string, lang: string): Promise<{ translated_text: string }> {
      if (!_isMockMode_global && ai) {
        dispatchApiCall('translateText', 'LIVE');
        try {
            const model = 'gemini-2.5-flash';
            const response = await ai.models.generateContent({
                model,
                contents: `Translate the following text from its original language into English. Just return the translated text, nothing else.\n\nText: "${text}"`
            });
            return { translated_text: response.text.trim() };
        } catch (error) {
            console.error("Gemini API call failed for translateText:", error);
            dispatchApiCall('translateText', 'ERROR');
        }
    }
    
    dispatchApiCall('translateText', 'MOCK');
    await this.delay(400);
    if (lang === 'pa') return { translated_text: "[Mock Translation] A large gathering is expected at the border. Everyone be ready." };
    if (lang === 'hi') return { translated_text: "[Mock Translation] A blockade is being planned at Wagah. The government will have to listen to us." };
    return { translated_text: "Translation not available in mock mode." };
  }
}

export const backendClient = new BackendClient();