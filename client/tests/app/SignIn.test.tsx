import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import SignIn from "@/app/signin/page";
import { AuthProvider } from "@/contexts/AuthContext";
import api from "@/service/api";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Só a camada HTTP é mockada: página, Header, Input, Button, AuthContext e
// authService rodam de verdade.
jest.mock("../../src/service/api");

const mockedApi = api as jest.Mocked<typeof api>;

describe("App - SignIn (integração)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("deve autenticar o usuário com e-mail e senha corretos, atualizar o Header e redirecionar para '/'", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { id: 1, email: "aluno@teste.com" },
    });

    render(
      <AuthProvider>
        <SignIn />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
      target: { value: "aluno@teste.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Senha123!" },
    });

    const botaoSubmit = screen
      .getAllByRole("button", { name: "Entrar" })
      .find((botao) => botao.getAttribute("type") === "submit")!;
    fireEvent.click(botaoSubmit);

    // Depois do login o Header passa a mostrar os botões de usuário logado
    expect(await screen.findByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Posts Curtidos" })).toBeInTheDocument();

    expect(mockedApi.post).toHaveBeenCalledWith("/auth/signin", {
      email: "aluno@teste.com",
      password: "Senha123!",
    });
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
