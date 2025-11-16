FROM directus/directus:11.13.2
LABEL org.opencontainers.image.description="Directus Custom Image For Extension Development"

USER node
WORKDIR /directus
HEALTHCHECK CMD wget http://localhost:8055/server/health || exit 1

COPY docker/database-migrations migrations/
COPY docker/extensions extensions/
COPY docker/email-templates templates/

### COPY EXTENSION
# COPY ../dist extensions/directus-extension-generate-types/dist
# COPY ../package.json extensions/directus-extension-generate-types/package.json
