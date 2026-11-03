import { createStore, useStore } from 'zustand'
import type { StoreApi } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface UiState {
	sidebarOpen: boolean
	setSidebarOpen: (open: boolean) => void
	toggleSidebar: () => void
}

export type UiStore = StoreApi<UiState>

export function createUiStore(
	initialState?: Partial<Pick<UiState, 'sidebarOpen'>>,
) {
	return createStore<UiState>()(
		devtools(
			(set) => ({
				sidebarOpen: initialState?.sidebarOpen ?? false,
				setSidebarOpen: (open) =>
					set({ sidebarOpen: open }, false, 'ui/setSidebarOpen'),
				toggleSidebar: () =>
					set(
						(state) => ({ sidebarOpen: !state.sidebarOpen }),
						false,
						'ui/toggleSidebar',
					),
			}),
			{ name: 'ui-store', enabled: process.env.NODE_ENV !== 'production' },
		),
	)
}

export const uiStore = createUiStore()

export function useUiStore<T>(selector: (state: UiState) => T): T {
	return useStore(uiStore, selector)
}
