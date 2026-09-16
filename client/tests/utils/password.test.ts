import {
  isPasswordValid,
  getPasswordValidationMessage,
} from "@/utils/password";

// Testes unitários de funções puras (sem renderizar componentes).
describe("Utils - Password", () => {
  describe("function isPasswordValid", () => {
    // BUG: password.ts usa `password.length <= 8`, então exige 9 caracteres
    // ou mais. O requisito diz "mínimo 8 caracteres". Este teste FALHA de propósito.
    test("[BUG] deve retornar true para senha forte com exatamente 8 caracteres (mínimo exigido pelo requisito)", () => {
      const senha = "Abcdef1@";

      expect(senha).toHaveLength(8);
      expect(isPasswordValid(senha)).toBe(true);
    });
  });

  describe("function getPasswordValidationMessage", () => {
    test("deve retornar uma mensagem relativa ao critério específico que a senha não atende", () => {
      expect(getPasswordValidationMessage("")).toBe("Senha é obrigatória");
      expect(getPasswordValidationMessage("abcdefgh1@")).toBe(
        "A senha deve conter: uma letra maiúscula"
      );
      expect(getPasswordValidationMessage("ABCDEFGH1@")).toBe(
        "A senha deve conter: uma letra minúscula"
      );
      expect(getPasswordValidationMessage("Abcdefghi@")).toBe(
        "A senha deve conter: um número"
      );
      expect(getPasswordValidationMessage("Abcdefgh12")).toBe(
        "A senha deve conter: um caractere especial"
      );
      expect(getPasswordValidationMessage("Abcdefgh1@")).toBe("");
    });
  });
});
