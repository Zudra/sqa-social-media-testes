import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// O contexto de autenticação é mockado para testar o Header isolado.
jest.mock("../../src/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;

describe("Components - Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("deve exibir o título e os botões 'Entrar' e 'Criar conta' para usuário deslogado, e o título deve levar para '/'", () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, logout: jest.fn() });

    render(<Header />);

    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar conta/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("SQA Social Media"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
