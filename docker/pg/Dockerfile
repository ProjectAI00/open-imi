FROM postgres:16-alpine

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=chatbot

EXPOSE 5432

COPY ./init.sql /docker-entrypoint-initdb.d/

VOLUME ["/var/lib/postgresql/data"] 