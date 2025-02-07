import { Elysia } from '../../src'

import { describe, expect, it } from 'bun:test'
import { delay, req } from '../utils'

describe('Before Handle', () => {
	it('globally skip main handler', async () => {
		const app = new Elysia()
			.onBeforeHandle<{
				params: {
					name?: string
				}
			}>(({ params: { name } }) => {
				if (name === 'Fubuki') return 'Cat'
			})
			.get('/name/:name', ({ params: { name } }) => name)

		const res = await app.handle(req('/name/Fubuki'))

		expect(await res.text()).toBe('Cat')
	})

	it('locally skip main handler', async () => {
		const app = new Elysia().get(
			'/name/:name',
			({ params: { name } }) => name,
			{
				beforeHandle: ({ params: { name } }) => {
					if (name === 'Fubuki') return 'Cat'
				}
			}
		)

		const res = await app.handle(req('/name/Fubuki'))

		expect(await res.text()).toBe('Cat')
	})

	it('group before handler', async () => {
		const app = new Elysia()
			.group('/type', (app) =>
				app
					.onBeforeHandle<{
						params: {
							name?: string
						}
					}>(({ params: { name } }) => {
						if (name === 'fubuki') return 'cat'
					})
					.get('/name/:name', ({ params: { name } }) => name)
			)
			.get('/name/:name', ({ params: { name } }) => name)

		const base = await app.handle(req('/name/fubuki'))
		const scoped = await app.handle(req('/type/name/fubuki'))

		expect(await base.text()).toBe('fubuki')
		expect(await scoped.text()).toBe('cat')
	})

	it('before handle from plugin', async () => {
		const transformId = (app: Elysia) =>
			app.onBeforeHandle<{
				params: {
					name?: string
				}
			}>(({ params: { name } }) => {
				if (name === 'Fubuki') return 'Cat'
			})

		const app = new Elysia()
			.use(transformId)
			.get('/name/:name', ({ params: { name } }) => name)

		const res = await app.handle(req('/name/Fubuki'))

		expect(await res.text()).toBe('Cat')
	})

	it('before handle in order', async () => {
		const app = new Elysia()
			.get('/name/:name', ({ params: { name } }) => name)
			.onBeforeHandle<{
				params: {
					name?: string
				}
			}>(({ params: { name } }) => {
				if (name === 'fubuki') return 'cat'
			})

		const res = await app.handle(req('/name/fubuki'))

		expect(await res.text()).toBe('fubuki')
	})

	it('globally and locally before handle', async () => {
		const app = new Elysia()
			.onBeforeHandle<{
				params: {
					name?: string
				}
			}>(({ params: { name } }) => {
				if (name === 'fubuki') return 'cat'
			})
			.get('/name/:name', ({ params: { name } }) => name, {
				beforeHandle: ({ params: { name } }) => {
					if (name === 'korone') return 'dog'
				}
			})

		const fubuki = await app.handle(req('/name/fubuki'))
		const korone = await app.handle(req('/name/korone'))

		expect(await fubuki.text()).toBe('cat')
		expect(await korone.text()).toBe('dog')
	})

	it('accept multiple before handler', async () => {
		const app = new Elysia()
			.onBeforeHandle<{
				params: {
					name?: string
				}
			}>(({ params: { name } }) => {
				if (name === 'fubuki') return 'cat'
			})
			.onBeforeHandle<{
				params: {
					name?: string
				}
			}>(({ params: { name } }) => {
				if (name === 'korone') return 'dog'
			})
			.get('/name/:name', ({ params: { name } }) => name)

		const fubuki = await app.handle(req('/name/fubuki'))
		const korone = await app.handle(req('/name/korone'))

		expect(await fubuki.text()).toBe('cat')
		expect(await korone.text()).toBe('dog')
	})

	it('handle async', async () => {
		const app = new Elysia().get(
			'/name/:name',
			({ params: { name } }) => name,
			{
				beforeHandle: async ({ params: { name } }) => {
					await delay(5)

					if (name === 'Watame') return 'Warukunai yo ne'
				}
			}
		)

		const res = await app.handle(req('/name/Watame'))

		expect(await res.text()).toBe('Warukunai yo ne')
	})

	it("handle on('beforeHandle')", async () => {
		const app = new Elysia()
			.on('beforeHandle', async ({ params: { name } }) => {
				await new Promise<void>((resolve) =>
					setTimeout(() => {
						resolve()
					}, 1)
				)

				if (name === 'Watame') return 'Warukunai yo ne'
			})
			.get('/name/:name', ({ params: { name } }) => name)

		const res = await app.handle(req('/name/Watame'))

		expect(await res.text()).toBe('Warukunai yo ne')
	})

	it('execute afterHandle', async () => {
		const app = new Elysia()
			.onBeforeHandle<{
				params: {
					name?: string
				}
			}>(({ params: { name } }) => {
				if (name === 'Fubuki') return 'Cat'
			})
			.onAfterHandle((context) => {
				if (context.response === 'Cat') return 'Not cat'
			})
			.get('/name/:name', ({ params: { name } }) => name)

		const res = await app.handle(req('/name/Fubuki'))

		expect(await res.text()).toBe('Not cat')
	})
})
