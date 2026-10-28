import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import Home from "@/app/page";
import { AuthProvider } from "@/contexts/AuthContext";
import api from "@/service/api";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Só a camada HTTP é mockada: página, Header, PostCard, AuthContext e
// postsService rodam de verdade.
jest.mock("../../src/service/api");

const mockedApi = api as jest.Mocked<typeof api>;

describe("App - Home (integração)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("deve exibir o feed da API e mostrar o alert de autenticação ao clicar em 'Curtir' com usuário deslogado", async () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    mockedApi.get.mockResolvedValueOnce({
      data: {
        posts: [
          {
            id: 1,
            title: "Primeiro post",
            body: "Corpo do primeiro",
            liked: false,
            reactions: { likes: 192, dislikes: 25 },
          },
          {
            id: 2,
            title: "Segundo post",
            body: "Corpo do segundo",
            liked: false,
            reactions: { likes: 859, dislikes: 32 },
          },
        ],
        total: 2,
        skip: 0,
        limit: 10,
      },
    });

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    expect(await screen.findByText("Primeiro post")).toBeInTheDocument();
    expect(screen.getByText("Corpo do primeiro")).toBeInTheDocument();
    expect(screen.getByText("Segundo post")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(mockedApi.get).toHaveBeenCalledWith("/posts", {
      params: { limit: 10, skip: 0, userId: undefined },
    });

    // Header deslogado
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();

    const [curtirPrimeiro] = screen.getAllByRole("button", { name: /Curtir/ });
    fireEvent.click(curtirPrimeiro);

    expect(alertSpy).toHaveBeenCalledWith(
      "Você precisa estar autenticado para curtir posts!"
    );
    expect(mockedApi.post).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  test("deve exibir junto a cada post as curtidas e descurtidas vindas da API", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        posts: [
          {
            id: 1,
            title: "Primeiro post",
            body: "Corpo do primeiro",
            liked: false,
            reactions: { likes: 192, dislikes: 25 },
          },
          {
            id: 2,
            title: "Segundo post",
            body: "Corpo do segundo",
            liked: true,
            reactions: { likes: 859, dislikes: 32 },
          },
        ],
        total: 2,
        skip: 0,
        limit: 10,
      },
    });

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    const [primeiro, segundo] = await screen.findAllByRole("listitem");

    expect(within(primeiro).getByText("Primeiro post")).toBeInTheDocument();
    expect(within(primeiro).getByText("👍 192 curtidas")).toBeInTheDocument();
    expect(within(primeiro).getByText("👎 25 descurtidas")).toBeInTheDocument();

    expect(within(segundo).getByText("Segundo post")).toBeInTheDocument();
    expect(within(segundo).getByText("👍 859 curtidas")).toBeInTheDocument();
    expect(within(segundo).getByText("👎 32 descurtidas")).toBeInTheDocument();
  });
});
