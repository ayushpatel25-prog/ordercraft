package com.ordercraft.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;

@Slf4j
@Configuration
@Profile("prod")
public class DatabaseConfig {

    @Value("${SPRING_DATASOURCE_URL:${DATABASE_URL:}}")
    private String rawUrl;

    @Value("${SPRING_DATASOURCE_USERNAME:}")
    private String defaultUsername;

    @Value("${SPRING_DATASOURCE_PASSWORD:}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");

        if (rawUrl != null && !rawUrl.trim().isEmpty()) {
            String cleanUrl = rawUrl.trim();
            log.info("Configuring production database connection...");

            if (cleanUrl.startsWith("jdbc:postgresql://") || cleanUrl.startsWith("jdbc:postgres://")) {
                config.setJdbcUrl(cleanUrl);
                if (defaultUsername != null && !defaultUsername.isEmpty()) {
                    config.setUsername(defaultUsername);
                }
                if (defaultPassword != null && !defaultPassword.isEmpty()) {
                    config.setPassword(defaultPassword);
                }
            } else if (cleanUrl.startsWith("postgresql://") || cleanUrl.startsWith("postgres://")) {
                try {
                    URI uri = new URI(cleanUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                    String path = uri.getPath(); // e.g., /ordercraft

                    String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                    config.setJdbcUrl(jdbcUrl);

                    if (uri.getUserInfo() != null) {
                        String[] userInfo = uri.getUserInfo().split(":", 2);
                        config.setUsername(userInfo[0]);
                        if (userInfo.length > 1) {
                            config.setPassword(userInfo[1]);
                        }
                    } else {
                        if (defaultUsername != null && !defaultUsername.isEmpty()) {
                            config.setUsername(defaultUsername);
                        }
                        if (defaultPassword != null && !defaultPassword.isEmpty()) {
                            config.setPassword(defaultPassword);
                        }
                    }
                    log.info("Normalized JDBC URL: jdbc:postgresql://{}:{}{}", host, port, path);
                } catch (Exception e) {
                    log.warn("Failed to parse URI from connectionString, falling back to prefixing jdbc:", e);
                    config.setJdbcUrl("jdbc:" + cleanUrl);
                    config.setUsername(defaultUsername);
                    config.setPassword(defaultPassword);
                }
            } else {
                config.setJdbcUrl(cleanUrl);
                config.setUsername(defaultUsername);
                config.setPassword(defaultPassword);
            }
        }

        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(300000);
        config.setConnectionTimeout(30000);

        return new HikariDataSource(config);
    }
}
