FROM node

WORKDIR /vidfront

COPY package*.json /vidfront/

RUN npm install 

COPY . /vidfront/

EXPOSE 3000
CMD [ "npm", "start" ]