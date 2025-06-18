package br.com.guardiao.guardiao.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> authorize
                        // AQUI ESTÁ A CORREÇÃO: Adicionamos "/" e "/index.html" à lista
                        .requestMatchers("/", "/index.html", "/historico.html", "/css/**", "/js/**", "/fonts/**", "/api/**").permitAll()
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}