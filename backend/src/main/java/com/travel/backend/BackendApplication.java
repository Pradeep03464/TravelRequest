package com.travel.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		// Force a stable default port for local development to avoid conflicts
		System.setProperty("server.port", "8082");
		SpringApplication.run(BackendApplication.class, args);
	}

}
