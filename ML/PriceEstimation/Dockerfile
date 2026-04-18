FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/quarkus-app/ ./quarkus-app/
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "./quarkus-app/quarkus-run.jar"]