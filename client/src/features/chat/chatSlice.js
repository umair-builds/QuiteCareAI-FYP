import { createSlice } from '@reduxjs/toolkit';

export const chatSlice = createSlice({
    name: 'chat',
    initialState: { replaySequence: null },
    reducers: {
        setReplaySequence: (state, action) => { state.replaySequence = action.payload; },
        clearReplaySequence: (state) => { state.replaySequence = null; }
    },
});

export const { setReplaySequence, clearReplaySequence } = chatSlice.actions;
export default chatSlice.reducer;