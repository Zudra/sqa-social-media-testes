package com.demoapp.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.demoapp.demo.model.UserPostReaction;
import com.demoapp.demo.repository.UserPostReactionRepository;

/**
 * Testes com Mockito.
 * O PostService é testado isolado, sem camada HTTP e sem banco: o
 * UserPostReactionRepository é um mock que simula as curtidas existentes.
 */
@ExtendWith(MockitoExtension.class)
public class PostServiceTests {

  private static final Long USER_ID = 1L;
  private static final Long POST_ID = 10L;

  @Mock
  private UserPostReactionRepository reactionRepository;

  private PostService postService;

  @BeforeEach
  void setUp() {
    postService = new PostService(reactionRepository);
  }

  @Test
  @DisplayName("Requisito 5: ao curtir um post ainda não curtido, salva a reação do usuário e retorna liked = true")
  void deveSalvarReacaoERetornarLikedTrueQuandoPostAindaNaoFoiCurtido() {
    when(reactionRepository.findByUserIdAndPostId(USER_ID, POST_ID)).thenReturn(Optional.empty());

    Map<String, Object> result = postService.toggleLike(POST_ID, USER_ID);

    ArgumentCaptor<UserPostReaction> captor = ArgumentCaptor.forClass(UserPostReaction.class);
    verify(reactionRepository).save(captor.capture());
    verify(reactionRepository, never()).delete(any());

    assertEquals(USER_ID, captor.getValue().getUserId());
    assertEquals(POST_ID, captor.getValue().getPostId());
    assertEquals(POST_ID, result.get("postId"));
    assertEquals(true, result.get("liked"));
  }

  @Test
  @DisplayName("Requisito 5: ao clicar em curtir um post já curtido, remove a reação existente e retorna liked = false")
  void deveRemoverReacaoERetornarLikedFalseQuandoPostJaFoiCurtido() {
    UserPostReaction existente = new UserPostReaction();
    existente.setId(99L);
    existente.setUserId(USER_ID);
    existente.setPostId(POST_ID);
    when(reactionRepository.findByUserIdAndPostId(USER_ID, POST_ID)).thenReturn(Optional.of(existente));

    Map<String, Object> result = postService.toggleLike(POST_ID, USER_ID);

    verify(reactionRepository).delete(existente);
    verify(reactionRepository, never()).save(any());

    assertEquals(POST_ID, result.get("postId"));
    assertEquals(false, result.get("liked"));
  }

}
