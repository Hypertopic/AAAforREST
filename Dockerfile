FROM node:22
COPY . /AAAforREST
WORKDIR /AAAforREST
RUN npm install

ENTRYPOINT ["node","app/proxy.js"]
