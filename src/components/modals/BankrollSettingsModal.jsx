// src/components/modals/BankrollSettingsModal.jsx
// Bankroll settings — bankroll size, unit sizing, risk tolerance, currency

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Shield, AlertTriangle, Save, RotateCcw } from 'lucide-react';
import { getBankrollData, updateBankrollSettings } from '../../lib/bankroll';

const RISK_LABELS = {
    conservative: { label: 'Conservative', desc: 'Max 3% per bet — slow & steady', color: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-900/20' },
    moderate:     { label: 'Moderate',     desc: 'Max 5% per bet — balanced approach', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-900/20' },
    aggressive:   { label: 'Aggressive',   desc: 'Max 10% per bet — high variance', color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-900/20' },
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export default function BankrollSettingsModal({ isOpen, onClose, onSettingsUpdated }) {
    const [settings, setSettings] = useState(null);
    const [dirty, setDirty] = useState(false);

    // Resets the local editable draft from storage each time the modal opens.
    // This is a real sync-with-external-system effect (reacts to the isOpen
    // prop, not just mount) rather than derivable state -- left as-is.
    useEffect(() => {
        if (isOpen) {
            const data = getBankrollData();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSettings({ ...data.settings });
            setDirty(false);
        }
    }, [isOpen]);

    if (!isOpen || !settings) return null;

    const update = (key, value) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            // Recalculate unit size when bankroll or percentage changes
            if (key === 'totalBankroll' || key === 'unitPercentage') {
                const bankroll = Number(key === 'totalBankroll' ? value : prev.totalBankroll) || 0;
                const pct = Number(key === 'unitPercentage' ? value : prev.unitPercentage) || 0;
                next.unitSize = (bankroll * pct) / 100;
            }
            return next;
        });
        setDirty(true);
    };

    const handleSave = () => {
        updateBankrollSettings(settings);
        setDirty(false);
        if (onSettingsUpdated) onSettingsUpdated();
        onClose();
    };

    const handleReset = () => {
        if (window.confirm('Reset bankroll settings to defaults? (This will NOT delete your bets.)')) {
            const defaults = { totalBankroll: 1000, unitSize: 50, unitPercentage: 5, currency: 'USD', riskTolerance: 'moderate' };
            setSettings(defaults);
            setDirty(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-900/30">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Bankroll Settings</h2>
                            <p className="text-xs text-slate-400">Configure your bankroll and unit sizing</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Bankroll & Currency */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Starting Bankroll</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={settings.totalBankroll}
                                    onChange={e => update('totalBankroll', Math.max(1, Number(e.target.value)))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Currency</label>
                            <select
                                value={settings.currency}
                                onChange={e => update('currency', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                            >
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Unit Sizing */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Unit Size — {settings.unitPercentage}% of bankroll
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={15}
                            step={0.5}
                            value={settings.unitPercentage}
                            onChange={e => update('unitPercentage', Number(e.target.value))}
                            className="w-full accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>1%</span>
                            <span className="text-emerald-400 font-bold">1 unit = ${(Number(settings.unitSize) || 0).toFixed(2)}</span>
                            <span>15%</span>
                        </div>
                    </div>

                    {/* Risk Tolerance */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Risk Tolerance</label>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(RISK_LABELS).map(([key, { label, desc, color, border, bg }]) => (
                                <button
                                    key={key}
                                    onClick={() => update('riskTolerance', key)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        settings.riskTolerance === key
                                            ? `${border} ${bg} ring-1 ring-offset-0 ring-${color.replace('text-', '')}`
                                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                    }`}
                                >
                                    <p className={`text-sm font-bold ${settings.riskTolerance === key ? color : 'text-slate-300'}`}>{label}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm font-semibold text-slate-300">Configuration Summary</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                            <span className="text-slate-500">Bankroll</span>
                            <span className="text-white font-medium text-right">${settings.totalBankroll.toLocaleString()}</span>
                            <span className="text-slate-500">1 Unit</span>
                            <span className="text-emerald-400 font-medium text-right">${settings.unitSize.toFixed(2)}</span>
                            <span className="text-slate-500">Max Bet ({RISK_LABELS[settings.riskTolerance]?.label})</span>
                            <span className="text-amber-400 font-medium text-right">
                                ${ settings.riskTolerance === 'conservative' ? (settings.totalBankroll * 0.03).toFixed(2)
                                  : settings.riskTolerance === 'moderate' ? (settings.totalBankroll * 0.05).toFixed(2)
                                  : (settings.totalBankroll * 0.10).toFixed(2)
                                }
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-800">
                    <button onClick={handleReset} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                        <RotateCcw size={14} /> Reset Defaults
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!dirty}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                                dirty
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <Save size={14} /> Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
