# Check out https://hub.docker.com/_/node to select a new base image
FROM node:14-buster-slim

ARG VCS_REF
ARG BUILD_DATE

LABEL social.myriad.api.image.authors="1@myriad.social" \
  social.myriad.api.image.vendor="Myriadsocial" \
  social.myriad.api.image.title="myriadsocial/myriad-api" \
  social.myriad.api.image.description="myriad-api" \
  social.myriad.api.image.source="https://github.com/myriadsocial/myriad-api/.maintain/docker/Dockerfile" \
  social.myriad.api.image.documentation="https://github.com/myriadsocial/myriad-api/"

# Change default user name
RUN usermod -d /home/myriad -l myriad node && \
  groupmod -n myriad node && \
  mkdir -p /home/myriad && \
  chown -R myriad:myriad /home/myriad

# Set to a non-root built-in user `myriad`
USER myriad

# Create app directory (with user `myriad`)
RUN mkdir -p /home/myriad/app

WORKDIR /home/myriad/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY --chown=myriad package*.json ./

RUN yarn install

# Bundle app source code
COPY --chown=myriad . .

RUN yarn run build

ENV NODE_ENV=production
# Bind to all network interfaces so that it can be mapped to the host OS
ENV HOST=0.0.0.0 PORT=3000

EXPOSE ${PORT}
CMD [ "node", "." ]
