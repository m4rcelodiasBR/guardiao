package br.com.guardiao.guardiao.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class RateLimiterService {

    private static final int TENTATIVAS_MAXIMA = 5;
    private static final int TEMPO_BLOQUEIO_MINUTOS = 10;

    private final Cache<String, Integer> cacheDeTentativas;

    public RateLimiterService() {
        this.cacheDeTentativas = Caffeine.newBuilder()
                .expireAfterWrite(TEMPO_BLOQUEIO_MINUTOS, TimeUnit.MINUTES)
                .build();
    }

    /**
     * Verifica se o IP está bloqueado
     */
    public boolean verificarBloqueio(String key) {
        return cacheDeTentativas.getIfPresent(key) != null && cacheDeTentativas.getIfPresent(key) >= TENTATIVAS_MAXIMA;
    }

    /**
     * Incrementa o contador de falhas para este IP
     */
    public void incrementarTentativa(String key) {
        Integer tentativa = cacheDeTentativas.getIfPresent(key);
        if (tentativa == null) {
            tentativa = 0;
        }
        tentativa++;
        cacheDeTentativas.put(key, tentativa);
    }

    /**
     * Limpa o contador se o login for bem sucedido
     */
    public void loginBemSucedido(String key) {
        cacheDeTentativas.invalidate(key);
    }

    /**
     * Retorna quantas tentativas restam
     */
    public int getTentativasRestantes(String key) {
        Integer tentativas = cacheDeTentativas.getIfPresent(key);
        if (tentativas == null) return TENTATIVAS_MAXIMA;
        return Math.max(0, TENTATIVAS_MAXIMA - tentativas);
    }
}
