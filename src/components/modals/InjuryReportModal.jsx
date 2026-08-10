// src/components/modals/InjuryReportModal.jsx
// Detailed injury report modal

import React, { useMemo } from 'react';
import { X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { InjuryBadge, InjuryImpactIcon } from '../ui/InjuryBadge';
import { getInjuryStatusStyle, getTeamImpactSummary, getInjuryDataSourceState } from '../../lib/injuries';

export default function InjuryReportModal({ isOpen, game, injuries, onClose }) {
    // F-27c — flag whether either team's data came from the mock fallback
    // (must run before the early return to keep hook order stable).
    const sourceState = useMemo(() => getInjuryDataSourceState(), [injuries]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isOpen || !game) return null;

    const homeInjuries = injuries[game.home] || [];
    const visitorInjuries = injuries[game.visitor] || [];
    const homeIsMock = sourceState.mockTeams.includes(game.home);
    const visitorIsMock = sourceState.mockTeams.includes(game.visitor);
    
    const renderTeamInjuries = (teamInjuries, _teamName, _teamAbbrev) => {
        if (teamInjuries.length === 0) {
            return (
                <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-slate-400">No injuries reported</p>
                </div>
            );
        }

        const sortedInjuries = teamInjuries.sort((a, b) => {
            const impactPriority = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4 };
            const aImpact = impactPriority[a.impact] || 4;
            const bImpact = impactPriority[b.impact] || 4;
            
            if (aImpact !== bImpact) return aImpact - bImpact;
            
            const statusPriority = { 'OUT': 1, 'DOUBTFUL': 2, 'QUESTIONABLE': 3, 'PROBABLE': 4 };
            return (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5);
        });

        return (
            <div className="space-y-3">
                {sortedInjuries.map((injury, index) => (
                    <div 
                        key={`${injury.name}-${index}`}
                        className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700"
                    >
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                style={{ backgroundColor: getInjuryStatusStyle(injury.status).color }}
                            >
                                {getInjuryStatusStyle(injury.status).label}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{injury.name}</span>
                                    <span className="text-slate-400 text-sm">{injury.position}</span>
                                    <InjuryImpactIcon impact={injury.impact} />
                                </div>
                                <div className="text-sm text-slate-300">{injury.injury}</div>
                                {injury.lastUpdate && (
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        Last update: {new Date(injury.lastUpdate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <InjuryBadge injury={injury} size="large" />
                    </div>
                ))}
            </div>
        );
    };

    const homeImpact = getTeamImpactSummary(homeInjuries);
    const visitorImpact = getTeamImpactSummary(visitorInjuries);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                        <h3 className="text-xl font-bold text-white">Injury Report</h3>
                        <span className="text-slate-400">
                            {game.visitor} @ {game.home}
                        </span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Visitor Team */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    {game.visitor}
                                    <span className="text-slate-400 text-sm">({visitorInjuries.length} injuries)</span>
                                    {visitorIsMock && (
                                        <span title="Simulated data — ESPN's live feed was unavailable for this team" className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-900/30 border border-amber-700/50 rounded-full px-2 py-0.5">
                                            <AlertTriangle size={10} /> SIMULATED
                                        </span>
                                    )}
                                </h4>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    visitorImpact.level === 'critical' ? 'bg-red-900 text-red-300' :
                                    visitorImpact.level === 'high' ? 'bg-orange-900 text-orange-300' :
                                    visitorImpact.level === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                                    'bg-green-900 text-green-300'
                                }`}>
                                    {visitorImpact.text}
                                </div>
                            </div>
                            {renderTeamInjuries(visitorInjuries, game.visitorName, game.visitor)}
                        </div>

                        {/* Home Team */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    {game.home}
                                    <span className="text-slate-400 text-sm">({homeInjuries.length} injuries)</span>
                                    {homeIsMock && (
                                        <span title="Simulated data — ESPN's live feed was unavailable for this team" className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-900/30 border border-amber-700/50 rounded-full px-2 py-0.5">
                                            <AlertTriangle size={10} /> SIMULATED
                                        </span>
                                    )}
                                </h4>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    homeImpact.level === 'critical' ? 'bg-red-900 text-red-300' :
                                    homeImpact.level === 'high' ? 'bg-orange-900 text-orange-300' :
                                    homeImpact.level === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                                    'bg-green-900 text-green-300'
                                }`}>
                                    {homeImpact.text}
                                </div>
                            </div>
                            {renderTeamInjuries(homeInjuries, game.homeName, game.home)}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-700">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span>OUT</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                    <span>DOUBTFUL</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <span>QUESTIONABLE</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span>PROBABLE</span>
                                </div>
                            </div>
                            <span>Data from ESPN • Updated continuously</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}