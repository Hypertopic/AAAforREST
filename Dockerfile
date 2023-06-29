FROM node:18-bullseye
COPY . /AAAforREST
WORKDIR /AAAforREST
RUN npm install

ENTRYPOINT ["node","app/proxy.js"]
