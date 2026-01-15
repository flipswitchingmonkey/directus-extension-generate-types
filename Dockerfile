# This Dockerfile builds a minimal image that copies the built extensions
# to a specified destination directory when run.
# This is useful for initializing Directus with custom extensions as an 
# init sidecar container.
# Usage:
#   docker build -t directus-extension-generate-types .
# ---------- build stage ----------
FROM alpine:3.18 AS src
WORKDIR /data/directus-extension-generate-types
COPY ./dist ./dist
COPY ./package.json ./

# ---------- runtime image ----------
FROM busybox:1.36-musl
ENV DEST=/initial-extensions
COPY --from=src /data /source
ENTRYPOINT [ \
  "/bin/sh", \
  "-c", \
  "echo 'Copying /source -> ${DEST}' && cp -a /source/. ${DEST}" \
  ]
