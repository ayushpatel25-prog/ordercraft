# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Cap Maven memory to fit within Render free tier (512MB RAM)
ENV MAVEN_OPTS="-Xmx384m -XX:+UseSerialGC"

# Copy POM and dependencies
COPY pom.xml .
COPY src ./src

# Build production jar skipping tests and documentation plugins
RUN mvn clean package -DskipTests -B -Dorg.slf4j.simpleLogger.defaultLogLevel=warn

# Runtime stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
VOLUME /tmp

# Copy generated jar
COPY --from=build /app/target/*.jar app.jar

# Run with low-memory footprint suited for cloud free tiers
ENV JAVA_OPTS="-Xmx384m -Xms128m -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom"
EXPOSE 8085

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
