package com.demoapp.demo.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Testes unitários simples (apenas JUnit).
 * Sem Spring, sem MockMvc e sem Mockito: as regras de validação não usam o
 * repositório, então o service é instanciado com null.
 */
public class UserServiceTests {

  private final UserService userService = new UserService(null);

  @Test
  @DisplayName("Requisito 1: aceita senha forte (8+ caracteres, maiúscula, minúscula, número e especial) e rejeita senhas que não atendem a algum critério")
  void deveValidarSenhaDeAcordoComOsCriteriosDeSenhaForte() {
    assertTrue(userService.isPasswordValid("Abcdef1!"),
        "'Abcdef1!' tem exatamente 8 caracteres e atende todos os critérios, deveria ser válida");
    assertTrue(userService.isPasswordValid("Password123!"),
        "'Password123!' atende todos os critérios, deveria ser válida");

    assertFalse(userService.isPasswordValid("Abcde1!"), "menos de 8 caracteres deveria ser inválida");
    assertFalse(userService.isPasswordValid("abcdef1!"), "sem letra maiúscula deveria ser inválida");
    assertFalse(userService.isPasswordValid("ABCDEF1!"), "sem letra minúscula deveria ser inválida");
    assertFalse(userService.isPasswordValid("Abcdefg!"), "sem número deveria ser inválida");
    assertFalse(userService.isPasswordValid("Abcdefg1"), "sem caractere especial deveria ser inválida");
  }

  @Test
  @DisplayName("Requisito 1: aceita e-mail com usuário, @ e domínio e rejeita e-mail sem @ ou nulo")
  void deveValidarEmailComArrobaEDominio() {
    assertTrue(userService.isEmailValid("aluno@teste.com"), "'aluno@teste.com' deveria ser válido");

    assertFalse(userService.isEmailValid("alunoteste.com"), "e-mail sem '@' deveria ser inválido");
    assertFalse(userService.isEmailValid(null), "e-mail nulo deveria ser inválido");
  }

}
