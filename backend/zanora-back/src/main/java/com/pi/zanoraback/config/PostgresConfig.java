package com.pi.zanoraback.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.pi.zanoraback.repository.jpa")
public class PostgresConfig {}