FROM node:latest

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY ./ /opt/app
RUN npm install
CMD ["npm", "start"]