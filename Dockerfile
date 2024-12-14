FROM node:22-slim
COPY . /AAAforREST
WORKDIR /AAAforREST
RUN npm install

ENTRYPOINT ["node","app/proxy.js"]
