import { expect, test } from 'bun:test'

import { createUiStore, type UiStore, uiStore } from '../ui-store'

test('creates an isolated ui store and toggles sidebar state', () => {
	const store: UiStore = createUiStore({ sidebarOpen: true })

	expect(store.getState().sidebarOpen).toBe(true)
	store.getState().toggleSidebar()
	expect(store.getState().sidebarOpen).toBe(false)
	store.getState().setSidebarOpen(true)
	expect(store.getState().sidebarOpen).toBe(true)
})

test('exports the shared app store', () => {
	expect(typeof uiStore.getState).toBe('function')
	expect(uiStore.getState().sidebarOpen).toBe(false)
})
