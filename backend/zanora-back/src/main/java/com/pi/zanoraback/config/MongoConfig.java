package com.pi.zanoraback.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoRepositories(basePackages = "com.pi.zanoraback.repository.mongo")
public class MongoConfig {}