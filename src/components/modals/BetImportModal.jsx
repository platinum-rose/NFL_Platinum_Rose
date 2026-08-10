import React, { useState } from 'react';
import logger from '../../lib/logger';
import { X, Upload, FileText, CheckCircle, AlertTriangle, Copy, Download, Trash2 } from 'lucide-react';
import { parseImportedBet, convertTobankrollBet, validateImportedBet } from '../../lib/betImport';
import { addBet, getBankrollData } from '../../lib/bankroll';

export default function BetImportModal({ 
  isOpen, 
  onClose, 
  onImportComplete = () => {} 
}) {
  const [importText, setImportText] = useState('');
  const [selectedSource, setSelectedSource] = useState('Auto-Detect');
  const [parsedBet, setParsedBet] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStep, setImportStep] = useState('input'); // 'input' | 'preview' | 'success'

  const sportsbooks = [
    'Auto-Detect',
    'Bookmaker', 
    'BetOnline',
    'DraftKings',
    'FanDuel',
    'BetMGM',
    'Caesars',
    'PointsBet'
  ];

  const handleParseBet = () => {
    if (!importText.trim()) {
      alert('Please paste bet text to import');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Parse the bet text
      const source = selectedSource === 'Auto-Detect' ? null : selectedSource;
      const parsed = parseImportedBet(importText, source);
      
      setParsedBet(parsed);
      
      // Validate the parsed bet
      const validation = validateImportedBet(parsed);
      setValidationResult(validation);
      
      // Move to preview step
      setImportStep('preview');
    } catch (error) {
      logger.error('Error parsing bet:', error);
      alert('Error parsing bet text. Please check the format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportBet = () => {
    if (!parsedBet || parsedBet.error) {
      alert('Cannot import bet with errors');
      return;
    }

    if (!validationResult?.isValid) {
      alert('Please fix validation errors before importing');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Convert to bankroll format
      const bankrollBet = convertTobankrollBet(parsedBet);
      
      if (!bankrollBet) {
        throw new Error('Failed to convert bet to bankroll format');
      }
      
      // Calculate unit size based on current bankroll
      const bankrollData = getBankrollData();
      bankrollBet.units = bankrollBet.amount / bankrollData.unitSize;
      
      // Add to bankroll
      const betId = addBet(bankrollBet);
      
      logger.log(`Imported bet with ID: ${betId}`);
      
      // Move to success step
      setImportStep('success');
      
      // Notify parent component
      onImportComplete(betId, bankrollBet);
      
    } catch (error) {
      logger.error('Error importing bet:', error);
      alert('Error importing bet to bankroll. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setImportText('');
    setParsedBet(null);
    setValidationResult(null);
    setImportStep('input');
    setSelectedSource('Auto-Detect');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const sampleBookmakerText = `4 TEAMS PARLAY (4 TEAMS)
NFL Seattle Seahawks -1-124
Los Angeles Rams vs Seattle Seahawks
Game Start 01/25/2026 @ 03:45 PM
LIVENFL New England Patriots +3Â½-151
New England Patriots vs Denver Broncos
Game Start 01/25/2026 @ 12:10 PM
NFL TOTAL o44-136 (Los Angeles Rams vrs Seattle Seahawks)
Los Angeles Rams vs Seattle Seahawks
Game Start 01/25/2026 @ 03:45 PM
OPEN PLAY
Game Start 01/25/2026 @ 12:26 PM
1 OPEN SPOTS Fill open spots

Placed 01/25/2026 @ 12:26 PM
Ticket # 727853342
Risk:$50.00Win:$447.39`;

  const sampleBetOnlineText = `Ticket Number:
930561328
Accepted Date:
1/17/26
Amount:
$7.00
Status:
Pending
To win:
$42.00
Type:
Future/Prop
Description:
NFL Futures - Super Bowl Futures - Super Bowl 2026 LX Winner - Buffalo Bills +600`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Upload size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import Sportsbook Bet</h2>
              <p className="text-slate-400 text-sm">
                {importStep === 'input' && 'Paste bet text from your sportsbook'}
                {importStep === 'preview' && 'Review and confirm bet details'}
                {importStep === 'success' && 'Bet imported successfully'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${importStep === 'input' ? 'text-blue-400' : 'text-emerald-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                importStep === 'input' ? 'border-blue-400 bg-blue-400/10' : 'border-emerald-400 bg-emerald-400/10'
              }`}>
                {importStep === 'input' ? '1' : <CheckCircle size={16} />}
              </div>
              <span className="font-medium">Import Text</span>
            </div>
            
            <div className="h-px bg-slate-700 flex-1 mx-4"></div>
            
            <div className={`flex items-center gap-2 ${
              importStep === 'input' ? 'text-slate-500' : 
              importStep === 'preview' ? 'text-blue-400' : 'text-emerald-400'
            }`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                importStep === 'input' ? 'border-slate-600 bg-slate-800' :
                importStep === 'preview' ? 'border-blue-400 bg-blue-400/10' : 'border-emerald-400 bg-emerald-400/10'
              }`}>
                {importStep === 'success' ? <CheckCircle size={16} /> : '2'}
              </div>
              <span className="font-medium">Review</span>
            </div>
            
            <div className="h-px bg-slate-700 flex-1 mx-4"></div>
            
            <div className={`flex items-center gap-2 ${
              importStep === 'success' ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                importStep === 'success' ? 'border-emerald-400 bg-emerald-400/10' : 'border-slate-600 bg-slate-800'
              }`}>
                {importStep === 'success' ? <CheckCircle size={16} /> : '3'}
              </div>
              <span className="font-medium">Complete</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {importStep === 'input' && (
            <div className="space-y-6">
              {/* Sportsbook Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Sportsbook Source</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  {sportsbooks.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Auto-detect will try to identify the sportsbook format automatically
                </p>
              </div>

              {/* Import Text Area */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Bet Text</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your bet text here..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white h-40 font-mono text-sm"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-slate-400">
                    Paste the full bet text from your sportsbook confirmation
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setImportText(sampleBookmakerText)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Copy size={12} />
                      Bookmaker Sample
                    </button>
                    <button
                      onClick={() => setImportText(sampleBetOnlineText)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Copy size={12} />
                      BetOnline Sample
                    </button>
                  </div>
                </div>
              </div>

              {/* Supported Formats Info */}
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-blue-400" />
                  <span className="font-medium text-white">Supported Formats</span>
                </div>
                <ul className="space-y-1 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={12} className="text-emerald-400" />
                    Bookmaker: Full parlay/single bet confirmations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={12} className="text-emerald-400" />
                    BetOnline: Futures and prop bet slips
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle size={12} className="text-amber-400" />
                    DraftKings: Coming soon
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle size={12} className="text-amber-400" />
                    FanDuel: Coming soon
                  </li>
                  <li className="text-xs text-slate-400 mt-2">
                    â„¹ï¸ Futures bets are tracked for portfolio management and hedging
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleParseBet}
                  disabled={!importText.trim() || isProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Parse Bet Text
                    </>
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {importStep === 'preview' && (
            <div className="space-y-6">
              {/* Parsed Bet Display */}
              {parsedBet && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Parsed Bet Details</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      parsedBet.error ? 'bg-red-900/20 text-red-400' : 'bg-emerald-900/20 text-emerald-400'
                    }`}>
                      {parsedBet.error ? 'Parse Error' : 'Parsed Successfully'}
                    </span>
                  </div>

                  {parsedBet.error ? (
                    <div className="text-red-400 text-sm">
                      <p className="font-medium">Error: {parsedBet.error}</p>
                      <p className="text-slate-400 mt-2">
                        Please check the bet text format or try selecting a different sportsbook source.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Bet Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Bet Type</p>
                          <p className="font-medium text-white">{parsedBet.description}</p>
                          {parsedBet.isHedgingBet && (
                            <span className="text-xs text-amber-400">Hedging Bet</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Risk Amount</p>
                          <p className="font-medium text-emerald-400">${parsedBet.riskAmount?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Potential Win</p>
                          <p className="font-medium text-emerald-400">${parsedBet.potentialWin?.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Bet Legs */}
                      <div>
                        <p className="text-sm font-medium text-white mb-2">Bet Legs ({parsedBet.legs?.length || 0})</p>
                        <div className="space-y-2">
                          {parsedBet.legs?.map((leg, index) => (
                            <div key={index} className={`p-3 rounded border ${
                              leg.betType === 'open' 
                                ? 'border-amber-500/30 bg-amber-900/10' 
                                : 'border-slate-600 bg-slate-700/50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-white">
                                    {leg.betType === 'open' ? 'ðŸ”“ OPEN SLOT' : `${leg.team} ${leg.line}`}
                                  </p>
                                  <p className="text-xs text-slate-400">{leg.game}</p>
                                  {leg.gameTime && leg.gameTime !== 'TBD' && (
                                    <p className="text-xs text-slate-500">{leg.gameTime}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-white">{leg.odds}</p>
                                  <p className="text-xs text-slate-400 capitalize">{leg.betType}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ticket Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Ticket Number</p>
                          <p className="font-mono text-white">#{parsedBet.ticketNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Placed Date</p>
                          <p className="text-white">{new Date(parsedBet.placedDate).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Results */}
              {validationResult && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {validationResult.isValid ? (
                      <CheckCircle size={16} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-400" />
                    )}
                    <span className="font-medium text-white">
                      {validationResult.isValid ? 'Validation Passed' : 'Validation Issues'}
                    </span>
                  </div>
                  
                  {!validationResult.isValid && (
                    <ul className="space-y-1 text-sm text-amber-300">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleImportBet}
                  disabled={!parsedBet || parsedBet.error || !validationResult?.isValid || isProcessing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Import to Bankroll
                    </>
                  )}
                </button>
                <button
                  onClick={() => setImportStep('input')}
                  className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {importStep === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Bet Imported Successfully!</h3>
              <p className="text-slate-400 mb-6">
                Your bet has been added to the bankroll management system and will appear in your bet history.
              </p>
              
              {parsedBet && (
                <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-slate-400 mb-2">Imported Bet Summary:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white ml-2">{parsedBet.description}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Amount:</span>
                      <span className="text-emerald-400 ml-2">${parsedBet.riskAmount?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Ticket:</span>
                      <span className="text-white ml-2">#{parsedBet.ticketNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Source:</span>
                      <span className="text-white ml-2">{parsedBet.source}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleReset}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Import Another Bet
                </button>
                <button
                  onClick={handleClose}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}