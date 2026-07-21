import { expect, test } from '@playwright/test'

test('create and delete a note', async ({ page }) => {
	const email = `e2e-${Date.now()}@example.com`
	await page.goto('/login')
	await page.getByRole('button', { name: 'Sign up' }).click()
	await page.getByPlaceholder('Name').fill('E2E Notes')
	await page.getByPlaceholder('Email').fill(email)
	await page.getByPlaceholder('Password').fill('password123')
	await page.locator('form button[type=submit]').click()
	await expect(page).toHaveURL(/\/notes/)

	await page.getByPlaceholder('Title').fill('My note')
	await page.getByPlaceholder('Content').fill('Note body')
	await page.getByRole('button', { name: 'Add note' }).click()
	await expect(page.getByText('My note')).toBeVisible()

	await page.getByRole('button', { name: 'Delete' }).click()
	await expect(page.getByText('My note')).toBeHidden()
})
