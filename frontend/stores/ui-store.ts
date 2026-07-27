import { createStore } from '@frontend/stores/create-store'

interface UIState {
	compact: boolean
	toggleCompact: () => void
	setCompact: (compact: boolean) => void
}

export const useUIStore = createStore<UIState>(
	(set) => ({
		compact: false,
		toggleCompact: () => set((state) => ({ compact: !state.compact })),
		setCompact: (compact) => set({ compact }),
	}),
	'ui-store',
)
