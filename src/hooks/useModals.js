import { useReducer, useState, useCallback } from 'react';

// --- All modal boolean states managed by a single reducer ---

const initialState = {
  splits: false,
  teasers: false,
  pulse: false,
  contest: false,
  audio: false,
  review: false,
  import: false,
  expertMgr: false,
  injuryReport: false,
  unitCalculator: false,
  betEntry: false,
  betImport: false,
  pendingBets: false,
  editBet: false,
  gradeModal: false,
  bankrollSettings: false,
  myCard: false,
};

function modalReducer(state, action) {
  switch (action.type) {
    case 'OPEN':
      return { ...state, [action.modal]: true };
    case 'CLOSE':
      return { ...state, [action.modal]: false };
    default:
      return state;
  }
}

export function useModals() {
  const [modals, dispatch] = useReducer(modalReducer, initialState);

  // Associated data that travels with specific modals
  const [selectedBetForEdit, setSelectedBetForEdit] = useState(null);
  const [gradeGameData, setGradeGameData] = useState(null);
  const [picksRefreshKey, setPicksRefreshKey] = useState(0);

  const openModal = useCallback((modal) => dispatch({ type: 'OPEN', modal }), []);
  const closeModal = useCallback((modal) => dispatch({ type: 'CLOSE', modal }), []);

  return {
    modals,
    openModal,
    closeModal,
    selectedBetForEdit,
    setSelectedBetForEdit,
    gradeGameData,
    setGradeGameData,
    picksRefreshKey,
    setPicksRefreshKey,
  };
}
