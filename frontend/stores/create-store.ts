import { create, type StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'

// NOTE: Redux DevTools browser extension v3.2.x has an MV3 regression that
// affects Zustand (reduxjs/redux-devtools#1731). The store only shows in the
// panel if the Redux DevTools tab is open BEFORE the page loads. If you see
// "No store found", open DevTools → Redux tab, then reload the page while the
// tab stays open. (Alternatively right-click the extension → "Open in a
// window", then reload.) The extension's MAIN-world content script sets
// window.__REDUX_DEVTOOLS_EXTENSION__ at document_start, so this factory just
// enables devtools unconditionally and lets zustand read the hook itself.

export function createStore<T>(
	initializer: StateCreator<T, [], [['zustand/devtools', never]]>,
	name: string,
) {
	return create<T>()(
		devtools(initializer, {
			name,
			enabled: true,
		}),
	)
}
