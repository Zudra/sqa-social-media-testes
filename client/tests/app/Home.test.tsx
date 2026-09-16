import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
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
          { id: 1, title: "Primeiro post", body: "Corpo do primeiro", liked: false },
          { id: 2, title: "Segundo post", body: "Corpo do segundo", liked: false },
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
});
