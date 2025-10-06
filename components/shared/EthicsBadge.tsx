import React, { useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';

const EthicsBadge: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="fixed bottom-4 right-4 z-20"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center space-x-2 bg-gray-700/80 backdrop-blur-sm text-green-300 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer">
                <ShieldCheck size={16} />
                <span>Ethics & Privacy Enabled</span>
            </div>
            {isHovered && (
                <div className="absolute bottom-full right-0 mb-2 w-72 bg-gray-800 border border-gray-600 rounded-lg p-3 text-xs text-gray-300 shadow-lg">
                    <p className="font-bold mb-1">Data & Privacy Policy:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Only public, open-source data is used.</li>
                        <li>No private data scraping or surveillance.</li>
                        <li>User data is anonymized where possible.</li>
                        <li>Operations comply with Indian laws and platform ToS.</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EthicsBadge;