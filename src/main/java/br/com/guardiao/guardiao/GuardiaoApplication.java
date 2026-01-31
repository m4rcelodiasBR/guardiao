package br.com.guardiao.guardiao;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class GuardiaoApplication {

	public static void main(String[] args) {
		SpringApplication.run(GuardiaoApplication.class, args);
	}

}
