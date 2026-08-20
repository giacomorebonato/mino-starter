import { fileURLToPath } from 'node:url'
import {
	isMainThread,
	parentPort,
	Worker,
	workerData,
} from 'node:worker_threads'
import { type LightpandaFetchOptions, lightpanda } from '@lightpanda/browser'

export async function requestFromBrowser(url: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const worker = new Worker(fileURLToPath(import.meta.url), {
			workerData: { url },
		})
		worker.on('message', (m) => {
			resolve(m as string)
			worker.terminate().catch(() => {})
		})
		worker.on('error', (e) => {
			reject(e)
			worker.terminate().catch(() => {})
		})
	})
}

if (!isMainThread) {
	const options: LightpandaFetchOptions = {
		dump: true,
		disableHostVerification: false,
	}
	void (async (): Promise<void> => {
		const response = await lightpanda.fetch(workerData.url, options)
		parentPort?.postMessage(response.toString())
	})()
}
