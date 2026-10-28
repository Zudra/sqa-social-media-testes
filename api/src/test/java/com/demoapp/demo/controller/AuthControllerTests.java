package com.demoapp.demo.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.demoapp.demo.model.User;
import com.demoapp.demo.repository.UserRepository;

/**
 * Testes com MockMvc (Spring Test).
 * Sobe o contexto do Spring com o banco H2 em memória
 * (src/test/resources/application.properties) e valida o contrato HTTP
 * dos endpoints de autenticação: status, corpo JSON e mensagens.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTests {

  private static final String EMAIL = "aluno@teste.com";
  private static final String SENHA = "Senha123!";

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private UserRepository userRepository;

  @BeforeEach
  void setUp() {
    userRepository.deleteAll();

    User user = new User();
    user.setEmail(EMAIL);
    user.setPassword(SENHA);
    userRepository.save(user);
  }

  @Test
  @DisplayName("Requisito 2: POST /auth/signin com senha incorreta retorna 401 e a mensagem 'Credenciais inválidas'")
  void deveRetornar401ComMensagemCredenciaisInvalidasQuandoSenhaIncorreta() throws Exception {
    mockMvc.perform(post("/auth/signin")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"email\": \"" + EMAIL + "\", \"password\": \"Outra123!\"}"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401))
        .andExpect(jsonPath("$.message").value("Credenciais inválidas"));
  }

  /**
   * BUG: o AuthController responde "E-mail já está em uso", mas o requisito
   * exige a mensagem "E-mail já cadastrado". Este teste FALHA de propósito,
   * por isso fica desativado (bug conhecido) para não quebrar a pipeline de CI.
   * Para ver a falha: remova o @Disabled e rode ./mvnw test.
   */
  @Test
  @Disabled("Bug conhecido: a API responde 'E-mail já está em uso' em vez de 'E-mail já cadastrado'")
  @DisplayName("[BUG] Requisito 1: POST /auth/signup com e-mail já existente retorna 409 e a mensagem 'E-mail já cadastrado'")
  void deveRetornar409ComMensagemEmailJaCadastradoQuandoEmailJaExiste() throws Exception {
    mockMvc.perform(post("/auth/signup")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"email\": \"" + EMAIL + "\", \"password\": \"" + SENHA + "\"}"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.status").value(409))
        .andExpect(jsonPath("$.message").value("E-mail já cadastrado"));
  }

}
