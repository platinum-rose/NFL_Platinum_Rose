// src/components/ui/InjuryBadge.jsx
// Displays injury information for players

import React from 'react';
import { getInjuryStatusStyle } from '../../lib/injuries';

export function InjuryBadge({ injury, size = 'small', onClick = null, className = '' }) {
    if (!injury || injury.status === 'HEALTHY') return null;

    const statusInfo = getInjuryStatusStyle(injury.status);
    const clickable = onClick ? 'cursor-pointer hover:scale-105 transition-transform' : '';
    
    if (size === 'large') {
        return (
            <div 
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-gray-800 text-white border-l-4 ${clickable} ${className}`}
                style={{ borderLeftColor: statusInfo.color }}
                onClick={onClick}
                title={`${injury.name} - ${injury.injury} (${injury.status})`}
            >
                <div 
                    className="w-3 h-3 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: statusInfo.color }}
                >
                    {statusInfo.label}
                </div>
                <span className="font-semibold">{injury.name}</span>
                <span className="text-gray-300">{injury.position}</span>
                <span className="text-gray-400 text-xs">{injury.injury}</span>
            </div>
        );
    }
    
    // Small badge (default)
    return (
        <div 
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-800 text-white ${clickable} ${className}`}
            onClick={onClick}
            title={`${injury.name} (${injury.position}) - ${injury.injury} (${injury.status})`}
        >
            <div 
                className="w-2 h-2 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: statusInfo.color }}
            >
                {statusInfo.label}
            </div>
            <span className="truncate max-w-[60px]">{injury.name}</span>
        </div>
    );
}

// Injury summary component for matchup cards
export function InjurySummary({ injuries = [], teamAbbrev: _teamAbbrev, maxDisplay = 2, onClick = null }) {
    const topInjuries = injuries.slice(0, maxDisplay);
    const remainingCount = Math.max(0, injuries.length - maxDisplay);
    
    if (topInjuries.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1 items-center">
            {topInjuries.map((injury, index) => (
                <InjuryBadge 
                    key={`${injury.name}-${index}`}
                    injury={injury}
                    size="small"
                    onClick={onClick}
                />
            ))}
            {remainingCount > 0 && (
                <div 
                    className={`inline-flex items-center px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 ${onClick ? 'cursor-pointer hover:bg-gray-600' : ''}`}
                    onClick={onClick}
                    title={`Click to see all ${injuries.length} injuries`}
                >
                    +{remainingCount} more
                </div>
            )}
        </div>
    );
}

// Impact indicator for critical injuries  
export function InjuryImpactIcon({ impact = 'low' }) {
    const impactStyles = {
        'critical': { icon: '🚨', color: '#ef4444', label: 'Critical Impact' },
        'high': { icon: '⚠️', color: '#f97316', label: 'High Impact' },
        'medium': { icon: '🟡', color: '#eab308', label: 'Medium Impact' },
        'low': { icon: '🟢', color: '#22c55e', label: 'Low Impact' }
    };

    const style = impactStyles[impact] || impactStyles['low'];

    return (
        <span 
            className="text-sm" 
            title={style.label}
            style={{ color: style.color }}
        >
            {style.icon}
        </span>
    );
}