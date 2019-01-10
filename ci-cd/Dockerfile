FROM node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install
RUN npm install -g bower
RUN npm install -g grunt
ENV NODE_ENV=dev
COPY . /usr/src/app
RUN bower install --allow-root
RUN grunt
CMD ["node","bin/www"]