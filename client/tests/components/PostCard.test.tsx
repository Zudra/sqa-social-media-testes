import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import PostCard from "@/components/PostCard";

// Teste unitário de componente: PostCard renderizado isolado, com onLike mockado.
describe("Components - PostCard", () => {
  const post = {
    id: 7,
    title: "Título do post",
    body: "Corpo do post",
    liked: false,
  };

  test("deve exibir título, corpo e dar feedback visual de curtido ao clicar em 'Curtir' com usuário logado", async () => {
    const onLike = jest.fn().mockResolvedValue(undefined);

    render(<PostCard post={post} isAuthenticated={true} onLike={onLike} />);

    expect(screen.getByText("Título do post")).toBeInTheDocument();
    expect(screen.getByText("Corpo do post")).toBeInTheDocument();

    const botao = screen.getByRole("button", { name: /Curtir/ });
    expect(botao).toHaveTextContent("🤍");

    fireEvent.click(botao);

    const botaoCurtido = await screen.findByRole("button", { name: /Curtido/ });
    expect(onLike).toHaveBeenCalledWith(7);
    expect(botaoCurtido).toHaveTextContent("❤️");
    expect(botaoCurtido.style.background).toBe("var(--secondary)");
  });
});
