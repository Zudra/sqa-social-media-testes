import { test, expect } from '@playwright/test';
import { API_URL } from '../support/ambiente';

interface PostDaApi {
  id: number;
  title: string;
  reactions: { likes: number; dislikes: number };
}

test.describe('E2E - Curtidas e descurtidas do DummyJSON', () => {
  test('a home mostra junto a cada post o número de curtidas e descurtidas', async ({ page, request }) => {
    // Mesma página de posts que a home carrega (limit 10, skip 0)
    const { posts } = (await (
      await request.get(`${API_URL}/posts`, { params: { limit: 10, skip: 0 } })
    ).json()) as { posts: PostDaApi[] };

    await page.goto('/');

    const cards = page.getByRole('listitem');
    await expect(cards).toHaveCount(posts.length);

    for (const [i, post] of posts.entries()) {
      const card = cards.nth(i);
      await expect(card.getByRole('heading')).toHaveText(post.title);
      await expect(card.getByText(`👍 ${post.reactions.likes} curtidas`, { exact: true })).toBeVisible();
      await expect(card.getByText(`👎 ${post.reactions.dislikes} descurtidas`, { exact: true })).toBeVisible();
    }
  });
});
