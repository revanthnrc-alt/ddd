import React, { useState, useCallback } from 'react';
import { Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnrichedPost } from '../../views/SocialRadarView';
import { backendClient } from '../../api/backendClient';

const threatColors = {
  none: 'bg-gray-500/50 text-gray-300',
  warning: 'bg-amber-500/50 text-amber-300',
  critical: 'bg-red-500/50 text-red-300',
};

const PostCard: React.FC<{ post: EnrichedPost }> = ({ post }) => {
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = useCallback(async () => {
        if (translatedText) { // Toggle off
            setTranslatedText(null);
            return;
        }
        setIsTranslating(true);
        const { translated_text } = await backendClient.translateText(post.text, post.lang);
        setTranslatedText(translated_text);
        setIsTranslating(false);
    }, [post.text, post.lang, translatedText]);

    return (
        <motion.div layout initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="bg-gray-700/50 p-3 rounded-lg">
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">@{post.user}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${threatColors[post.threat_level || 'none']}`}>
                        {post.threat_level || 'none'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600 text-gray-300 font-mono">
                        {post.lang.toUpperCase()}
                    </span>
                </div>
                {post.lang !== 'en' && (
                    <button onClick={handleTranslate} disabled={isTranslating} className="text-gray-400 hover:text-blue-400 p-1 disabled:opacity-50">
                        <Languages size={16} />
                    </button>
                )}
            </div>
            <p className="text-sm text-gray-300 mt-1">{post.text}</p>
            {translatedText && (
                <div className="mt-2 p-2 bg-black/20 rounded-md border-l-2 border-blue-400">
                    <p className="text-xs text-blue-300 italic">{translatedText}</p>
                </div>
            )}
            <p className="text-xs text-gray-500 mt-2 text-right">{new Date(post.timestamp).toLocaleTimeString()}</p>
        </motion.div>
    );
};


const LiveFeedPanel: React.FC<{ posts: EnrichedPost[] }> = ({ posts }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold text-blue-400 mb-4">Live OSINT Feed</h2>
      <div className="flex-grow overflow-y-auto pr-2 space-y-3">
        <AnimatePresence>
          {posts.map(post => <PostCard key={post.post_id} post={post} />)}
        </AnimatePresence>
        {posts.length === 0 && <p className="text-center text-gray-500 mt-8">Stream is idle.</p>}
      </div>
    </div>
  );
};

export default LiveFeedPanel;